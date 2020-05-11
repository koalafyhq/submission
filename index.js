const url = require('url')
const https = require('https')
const express = require('express')
const morgan = require('morgan')

const { check, validationResult } = require('express-validator')

const app = express()

app.use(express.json())
app.use(morgan('combined'))

const port = process.env.PORT || 8080
const slackWebhook = url.parse(process.env.SLACK_WEBHOOK_URI, true)

const validate = [
  check('madu').isEmpty(),
  check('name')
    .notEmpty()
    .isLength({ max: 300 }),
  check('company')
    .notEmpty()
    .isLength({ max: 300 }),
  check('email')
    .isEmail()
    .isLength({ max: 300 }),
  check('referrer')
    .notEmpty()
    .isLength({ max: 300 }),
  check('notes')
    .notEmpty()
    .isLength({ max: 1024 })
]

function boot() {
  console.log(`Server is running on http://localhost:${port}`)
}

function sendToSlack(payload) {
  const { name, company, email, referrer, notes } = payload

  const opts = {
    method: 'POST',
    hostname: slackWebhook.hostname,
    path: slackWebhook.path,
    port: 443
  }

  const data = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'New partnership submission:'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:* ${name}`
          },
          {
            type: 'mrkdwn',
            text: `*Company:* ${company}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${email}`
          },
          {
            type: 'mrkdwn',
            text: `*Referrer:* ${referrer}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: notes
        }
      }
    ]
  }

  const req = https.request(opts)

  req.on('error', err => {
    throw err
  })

  req.write(JSON.stringify(data))
  req.end()
}

app.post('/', validate, (req, res) => {
  const err = validationResult(req)

  if (!err.isEmpty()) {
    return res.status(422).json({ errors: err.array() })
  }

  try {
    sendToSlack(req.body)
  } catch (err) {
    return res.status(500).json({ errors: err.toString() })
  }

  res.send({ ok: 'thanks' })
})

app.listen(port, boot)
