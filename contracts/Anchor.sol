// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Anchor {
    event AnchorRoot(bytes32 indexed root, address indexed issuer);

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function anchor(bytes32 root) external returns (bool) {
        emit AnchorRoot(root, msg.sender);
        return true;
    }
}
