const Imap = require('imap');
const promisify = require('util').promisify;
const { simpleParser } = require('mailparser');
const { emailAccount, passwordAccount, mailServer, port } = require('./config.js')

const imapConfig = {
    user: emailAccount,
    password: passwordAccount,
    host: mailServer,
    port: port,
    tls: true,
    tlsOptions: { 
      rejectUnauthorized: false, 
    }
  };



const getToken = (text) => {
    try {
      const tokenPattern = /\d{6}/g;

      const valor = text.match(tokenPattern);

      if (valor != null && valor != undefined) {
        return valor[0];
      }

      return "";
    }
    catch (err) {
    }
  }

const imap = new Imap(imapConfig);

const openBox = promisify(imap.openBox.bind(imap));

var getEmails = new Promise(    
    
    function(resolve, reject) {
        const result = []; 
        let counter = 0; 

        try {
            imap.once('ready', () => {            
                openBox('INBOX', false)
                  .then(inbox => {
                      const criteriaSearch = ['ALL', ['SINCE', new Date()], ['FROM', 'giogama@hotmail.com']];
                      //const criteriaSearch = ['ALL', ['FROM', 'giogama@hotmail.com']]; 
              
                      const search = promisify(imap.search.bind(imap));
              
                      search(criteriaSearch).then(messages => {
                          
                          const last3Messages = messages.slice(-3);                                              

                          console.log(last3Messages);
              
                          if (!last3Messages && !last3Messages.length)
                          {
                            const f = imap.fetch(last3Messages, {bodies: ''});
                            f.on('message', (msg) => {
                                msg.on('body', (stream) => {
                                  counter++;  
                                  simpleParser(stream, (err, parsed) => {
                                    const {from, subject, textAsHtml, text} = parsed;                            
                                    
                                    let token = getToken(text);                              
                                    
                                    if (token != "") {               
                                          result.push(token);
                                    }     
                                    
                                    if (counter === last3Messages.length) {                                  
                                        resolve(result);                
                                    }   
                                  });
                                });
                                msg.once('attributes', (attrs) => {
                                  const {uid} = attrs;
                                  const attr = '\\Deleted';
                
                                  imap.addFlags(uid, [attr], () => {
                                    // Mark the email as read after reading it                              
                                  });
                                });
                              });
                              f.once('error', (ex) => {
                                reject(ex);
                              });
                              f.once('end', () => {                                                    
                                imap.end();                               
                              });
                          }
                          else {
                            resolve(result);
                            imap.end();                               
                          }                          
                      })
                      .catch(err => {
                          reject(err);
                          imap.end();
                      })
                  })
                  .catch(err => {
                    reject(err);
                    imap.end();
                  })
              });
              
            imap.connect();   
        }
        catch (err){
            reject(err);
        }           
    }
);


getEmails.then(function(result) {
    console.log("resultado: ", result.reverse());    
}).catch(function(err) {
    console.log("Falha: ", err);
});

