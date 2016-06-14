# Mock Secure Server

A simple server for integration testing IODiCUS. This server mocks the role of a Secure server and will respond appropriately to HTTP and WebSockets requests.

The mock secure server exposes a socket interface for `send` and `receive` events. To configure the port used for this interface the `SOCKET_PORT` environment variable is set.

To install the test you must clone this module and its dependencies:

```
  git clone https://github.com/lukem512/mock-secure-server.git
  cd ./mock-secure-server
  npm install
```

To run the mock secure server the following command is used:

```
  SOCKET_PORT=3000 npm start
```
