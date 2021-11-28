const Imap = require('imap'),
inspect = require('util').inspect;
const timestamp = require('log-timestamp');
const playwright = require('playwright');
var colors = require('colors');
console.logCopy = console.log.bind(console);
var fs = require('fs');
const json = JSON.parse(fs.readFileSync('config.json'));

    (async () => {
    
        for (const browserType of [playwright.chromium]) {
          const browser = await browserType.launch({ headless: false});
          const context = await browser.newContext();
          const page = await context.newPage();
          var email = json['email']
          var password = json['password']

          await page.goto('https://target.com/account/');
          console.log("Visting Site")
          await page.focus('#username')
          await page.keyboard.type(email)
          await sleep(500)
          await page.click("#recoveryPassword")
          await sleep(500)
          await page.click("#continue")
          await page.focus('#__next > div:nth-child(2) > div > div.styles__ContentWrapper-sc-19gc5cv-1.ivxWTl > div > div.Grid__StyledGrid-sc-12oz055-0.UEqhP > div > div > form > input')
          console.log("Requested Code")
          console.log("Sleeping")
          await sleep(20000)
          const imap = new Imap({
            user: "",
            password: "",
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        });
        
        imap.connect();
        console.log("Connected to IMAP" .green)
        
        
        async function openInbox(cb) {
            imap.openBox('INBOX', false, cb);
        }
        
        imap.once('ready', async function () {
            await openInbox(async function (err, box) {
                if (err) throw err;
                imap.search(['UNSEEN', ['SINCE', 'Oct 27, 2021'],
                ['FROM', 'orders@oe1.target.com'],
                ['SUBJECT', 'Your Target.com password reset code']
                ], function (err, results) {
                    if (err) throw err;
                    var f = imap.fetch( results,{
                        bodies: ''
                    });
        
                    f.on('message', async function (msg, seqno) {
                        msg.on('body', async function (stream, info) {
                            let buffer = '';
                            stream.on('data', async function (chunk) {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', async function reg() {
                                var number = buffer.split(`Your Target.com password reset code is`)[1].split('.')[0];
                                msg.once('attributes', attrs => {
                                    const {
                                        uid
                                    } = attrs;
                                    imap.addFlags(uid, ['\\Seen'], () => {});
                                });
                                console.log("Marked as read")
                                console.log("Reset code found: "+number .magenta);
                                await page.keyboard.type(number)
                                await page.click("#verify");
                                await sleep(500)
                                await page.focus('#password')
                                await page.keyboard.type(password)
                                console.log("Setting New Pass")
                                await sleep(500)
                                await page.click("#submit")
                                console.log("Account Reset" .green)
                                await sleep(1000)
                                await browser.close()
                            });
                        });
                    });
        
                    f.on('error', async function (err) {
                        console.error(error)
                    });
        
                    f.once('end', function () {
                      
                        imap.end();
                    });
        
                })
            });
        });
        }
        function sleep(ms) {
            return new Promise(resolve => {
              setTimeout(resolve, ms)
            })
          }
 
          
      })();
