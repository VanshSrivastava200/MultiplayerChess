import {io} from 'socket.io-client'

export const connectWS=()=>{
    return io('http://localhost:3000')
}