import concurrent from "concurrently";

concurrent([
    { 
        name: "server",
        command: "bun run dev",
        cwd: "packages/server",
        prefixColor: "red",
    },
    { 
        name: "client",
        command: "bun run dev",
        cwd: "packages/client",
        prefixColor: "green",
    },
])