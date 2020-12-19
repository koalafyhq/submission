const express = require('express')
const morgan = require('morgan')

const postmark = require('postmark')

const { check, validationResult } = require('express-validator')

const app = express()

app.use(express.json())
app.use(morgan('combined'))

const port = process.env.PORT || 8080

const postmarkToken = process.env.POSTMARK_TOKEN
const client = new postmark.ServerClient(postmarkToken)

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
    .isLength({ max: 1024 }),
]

function boot() {
  console.log(`Server is running on http://localhost:${port}`)
}

function sendEmail(payload) {
  const { name, company, email, referrer, notes } = payload

  const emailTemplate = `
    <div>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Referrer:</strong> ${referrer}</p>
      <p><strong>Notes:</strong></p>
      <div>${notes}</div>
    </div>`

  client.sendEmail({
    From: 'hi@koalafyhq.com',
    To: 'hi@koalafyhq.com',
    Subject: 'New partnership submission!',
    HtmlBody: emailTemplate,
    TextBody: 'Hello!',
  })
}

app.post('/', validate, (req, res) => {
  const err = validationResult(req)

  if (!err.isEmpty()) {
    return res.status(422).json({ errors: err.array() })
  }

  try {
    sendEmail(req.body)
  } catch (err) {
    return res.status(500).json({ errors: err.toString() })
  }

  res.send({ ok: 'thanks' })
})

app.listen(port, boot)
