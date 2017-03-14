Install nodejs 

In Debian, you should install a nodejs fresh enough, commands recommended below

  `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`

  `sudo apt-get install -y nodejs`


Clone this repo then npm i 

To run this server in backgrond, here recommend a tool-`forever`

 `sudo npm install -g forever --registry=http://registry.cnpmjs.org`
 
 `forever start [your js]`
