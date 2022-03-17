# message-forwarding-client

## Install

npm i

## Run

node index

## Usage

This is a client for https://github.com/codebloodedape/message-forwarding-server. 
You can setup multiple clients by cloning this repo and updating the ```clientId``` in the code (line no. 7)

First of all, start the server and the clients

This is a console client application so all the commands can be entered from console

Commands:

  1. <recipient_client_id>,<message> : this command is to send a small message to a client via server. 
    Eg. ```2,hello```
 
  2. <recipient_client_id> : this command is to send a large message to a client. The message should be in the file ```./data/long_message.txt```
    Eg. ```2```
  
  3. ```c``` : this command is to generate a long file ```./data/long_message.txt``` . This is already added to the repo so no need to run it.
  
