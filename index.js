const io = require('socket.io-client')
const stdin = process.openStdin()
const crypto = require('crypto')
const fs = require('fs')

const server = 'http://localhost:3000/'
const clientId = 1
const algorithm = 'aes-256-cbc'
const sercretKey = 'secretkey'
const filePath = './data/long_message.txt'
const outfilePath = './data/output.txt'

// Create socket connection with server
console.log('Connecting to server...')
const socket = io.connect(server, {
    reconnection: true
})

socket.on('connect', () => {
    console.log('Connected to server')
    console.log('Registering client...')
    socket.emit('connectionEvent', clientId)
    console.log('Client registered')
    socket.on('serverEvent', serverEventHandler)
    stdin.addListener('data', inputEventHandler)
})

const serverEventHandler = (data) => {
    console.log('Message recieved')
    if (data.streamMessage) {
        steamMessageReciever()
    } else {
        const messageParts = data.message.split('::')
        if (messageParts[1] && messageParts[1] === 'VERIFIED') {
            const decryptedMessage = decrypt(messageParts[0])
            console.log('Message decrpyted successfully')
            console.log('VERIFIED')
        } else {
            console.log('UNVERIFIED')
        }
    }
}

const steamMessageReciever = () => {
    console.log('Message stream requested from server. The message will be saved in ' + outfilePath + '. Clearing the file...')
    fs.writeFileSync(outfilePath, '')
    console.log(outfilePath + ' cleared')
    const ws = fs.createWriteStream(outfilePath)
    socket.on('serverStreamEvent', (verfiedChuck) => {
        const verfiedChuckParts = verfiedChuck.split('::')
        if (verfiedChuckParts[1] === 'VERIFIED') {
            ws.write(decrypt(verfiedChuckParts[0]), 'utf-8', (err) => {
                if (err) {
                    console.log(err.message)
                }
            })
        } else {
            console.log('UNVERIFIED')
        }
    })
    socket.on('serverStreamEndEvent', () => {
        console.log('Message has been completely streamed. Check out ', outfilePath)
        console.log('VERIFIED')
        ws.close()
    })
    console.log('Message has started streaming from server to the file')
    socket.emit('ackClientEvent')
}

const inputEventHandler = (inputCommand) => {
    const command = inputCommand.toString().trim()
    const commandParts = command.split(',')
    if (commandParts[0] === 'c') {
        generateLongFile()
    } else if (commandParts.length === 2) {
        sendMessage(parseInt(commandParts[0]), commandParts[1])
    } else if (commandParts.length === 1) {
        sendMessageFromFile(parseInt(commandParts[0]))
    } else {
        console.log('Invalid command')
    }
}

const generateLongFile = () => {
    console.log('Generating a long file...')
    fs.writeFileSync(filePath, '')
    let count = 0
    while (count < 10000) {
        fs.appendFile(filePath, 'This is a test', (err) => {
            if (err) {
                console.log(err.message)
            }
        })
        count++
    }
    console.log('Long file generated. Checkout ', filePath)
}

const sendMessage = (recieverClientId, message) => {
    console.log('Sending message "' + message + '" to client ' + recieverClientId + '...')
    const data = {
        message: encrypt(message),
        client: recieverClientId,
        timestamp: new Date(),
    }
    socket.emit('clientEvent', data)
    console.log('Message sent to server')
}

const sendMessageFromFile = (recieverClientId) => {
    console.log('Sending message from ' + filePath + ' to client ' + recieverClientId + '...')
    const data = {
        client: recieverClientId,
        timestamp: new Date(),
        streamMessage: true,
        sender: clientId,
    }
    socket.on('ackServerEvent', streamDataFromFile)
    console.log('Requesting server to allow streaming...')
    socket.emit('clientEvent', data)
}

const streamDataFromFile = () => {
    console.log('Server has allowed streaming. Starting stream...')
    const rs = fs.createReadStream(filePath, 'utf-8')
    rs.on('data', (chunk) => {
        socket.emit('clientStreamEvent', encrypt(chunk))
    })
    rs.on('end', () => {
        socket.emit('clientStreamEndEvent')
        console.log('Message has been completely streamed to server')
    })
}

const encrypt = (data) => {
    var cipher = crypto.createCipher(algorithm, sercretKey)
    var encryptedData = cipher.update(data, 'utf8', 'hex')
    encryptedData += cipher.final('hex')
    return encryptedData
}

const decrypt = (data) => {
    const decipher = crypto.createDecipher(algorithm, sercretKey)
    let decryptedData = decipher.update(data, 'hex', 'utf8')
    decryptedData += decipher.final('utf8')
    return decryptedData
}

