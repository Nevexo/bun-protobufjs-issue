import protoLoader from "@grpc/proto-loader"
import grpc from "@grpc/grpc-js"
import { ReflectionService } from "@grpc/reflection"
import { resolve } from "path"

const PROTO_PATH = resolve("protos/demo.proto")
const server = new grpc.Server();

const rpc_SayHello = async (call, callback) => {
  return callback(null, { message: `Hello, ${call.request.name}` })
}

const main = async () => {
  if (!Bun.file(PROTO_PATH).exists()) {
    console.error(`File not found: ${PROTO_PATH}`)
    return;
  }

  console.log(`Using protobuf file: ${PROTO_PATH}`)

  // Load protobuf file
  const packageDefinition = await protoLoader.load(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
  const proto = grpc.loadPackageDefinition(packageDefinition)

  // Setup protobuf reflection server
  const reflector = new ReflectionService(packageDefinition)
  reflector.addToServer(server)

  // Add RPC methods
  server.addService(proto.DemoService.service, {
    SayHello: rpc_SayHello
  })

  // Bind to 50051 on IPv4 loopback
  server.bindAsync("127.0.0.1:50051", grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) return err
    console.log("Listening")
  })
}

main()