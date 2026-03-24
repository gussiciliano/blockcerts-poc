import express from 'express'
import path from 'path'
import fs from 'fs/promises'
import qrcode from 'qrcode'
import { issueCredential } from './issuer'
import { verifyCredential, loadCredentialById } from './verifier'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.use('/public', express.static(path.join(process.cwd(), 'public')))

app.post('/issue', async (req, res) => {
  try {
    const { subject, issuer } = req.body
    if (!subject) return res.status(400).json({ error: 'subject required' })
    const r = await issueCredential(subject, issuer || 'Demo Issuer')
    res.json({ ok: true, id: r.id, certUrl: `/cert/${r.id}` })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/cert/:id', async (req, res) => {
  const id = req.params.id
  const c = await loadCredentialById(id)
  if (!c) return res.status(404).json({ error: 'not found' })
  res.json(c)
})

app.get('/cert/:id/qrcode', async (req, res) => {
  const id = req.params.id
  const c = await loadCredentialById(id)
  if (!c) return res.status(404).json({ error: 'not found' })

  // build absolute URL to credential
  const fullUrl = `${req.protocol}://${req.get('host')}/cert/${id}`
  try {
    const buffer = await qrcode.toBuffer(fullUrl, { type: 'png' })
    res.type('image/png').send(buffer)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/verify', async (req, res) => {
  try {
    let credential = req.body.credential
    if (!credential && req.body.url) {
      // support /cert/:id style URL
      const url = req.body.url as string
      if (url.startsWith('/cert/')) {
        const id = url.replace('/cert/', '')
        credential = await loadCredentialById(id)
      }
    }
    if (!credential) return res.status(400).json({ error: 'credential or url required' })
    const r = await verifyCredential(credential)
    res.json(r)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/verify', async (req, res) => {
  const url = req.query.url as string
  if (!url) return res.status(400).json({ error: 'url required' })
  let credential = null
  if (url.startsWith('/cert/')) {
    credential = await loadCredentialById(url.replace('/cert/', ''))
  }
  if (!credential) return res.status(404).json({ error: 'credential not found' })
  const r = await verifyCredential(credential)
  res.json(r)
})

const port = process.env.PORT || 3000
app.listen(+port, () => console.log(`Server listening on ${port}`))
