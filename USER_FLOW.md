# Flujo del PoC — Explicación para no técnicos

Este documento explica, en lenguaje simple, cómo funciona el proof-of-concept (PoC) de certificados digitales basado en ideas de Blockcerts. No se requiere conocimiento técnico para entender el flujo.

1) Actores principales
- **Emisor**: la entidad que crea y firma el certificado (por ejemplo, una universidad). En el PoC es un servicio que corre en un servidor local.
- **Titular**: la persona que recibe el certificado (por ejemplo, un graduado). En este PoC el certificado se guarda como un archivo JSON que el titular puede compartir.
- **Verificador**: cualquiera que quiera comprobar que el certificado es auténtico (por ejemplo, un empleador). El verificador consulta el servicio para validar el certificado.

2) Qué hace el sistema (visión general)
- El emisor crea un certificado con los datos del titular (nombre, título, fecha, etc.).
- El emisor firma cryptográficamente el certificado con una clave privada que sólo él controla. Esto garantiza que el certificado fue emitido por esa entidad.
- Se calcula un "resumen" (hash) del contenido del certificado y se guarda en un registro local (simulando anclarlo en una blockchain). Ese resumen sirve como huella digital inmutable del certificado.
- El certificado firmado y su huella quedan almacenados en el servidor y pueden accederse por una URL pública.

3) Cómo se verifica un certificado
- El verificador carga el certificado (subiéndolo o consultando su URL).
- El verificador comprueba dos cosas básicas:
  - que la firma del emisor es válida (esto confirma que el certificado fue firmado por el emisor),
  - que la huella (hash) del certificado coincide con la lista de huellas registradas (esto confirma que el certificado no fue alterado desde que fue emitido).
- Si ambas comprobaciones son correctas, el verificador informa que el certificado es "válido".

4) Elementos de la demo y cómo probarla (pasos simples)
- Generar claves del emisor: el sistema crea una clave pública y otra privada. La privada la usa el emisor para firmar; la pública se usa para verificar.
- Crear (emitir) un certificado: el emisor genera el archivo del certificado, lo firma y guarda su huella en el registro local.
- Verificar: desde la interfaz web se puede pegar el JSON del certificado o escribir su ID para que el servidor compruebe firma y huella.
- QR: cada certificado tiene una URL; el sistema puede generar un código QR que apunta a esa URL para facilitar la verificación en móvil.

5) Limitaciones del PoC (importante)
- En este PoC la "anclación" (anchoring) se hace localmente guardando huellas en un archivo (`data/anchors.json`). En una solución real, las huellas se suelen anclar en una blockchain pública para mayor seguridad e independencia.
- Las claves se guardan en archivos locales (`keys/`) para facilitar la demo. En producción deben guardarse en un servicio seguro (gestor de secretos o HSM).
- El PoC está pensado para demostraciones y pruebas; no está pensado para uso en producción sin cambios de seguridad y escalabilidad.

6) Beneficios clave (por qué usar este enfoque)
- Permite comprobar la autenticidad de un certificado sin contactar directamente al emisor cada vez.
- Al añadir una huella inmutable, se hace difícil falsificar o modificar un certificado sin que la verificación lo detecte.

7) Recursos y referencias en el repositorio
- Interfaz de verificación: `public/index.html`.
- Endpoints principales: `POST /issue`, `GET /cert/:id`, `POST /verify`, `GET /cert/:id/qrcode`.
- Código del emisor: `src/issuer.ts`.
- Código del verificador: `src/verifier.ts`.

Si quieres, puedo convertir parte de este contenido en una presentación corta para mostrar en una demo o en un PDF con diagramas.
