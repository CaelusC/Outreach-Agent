# Outreach-Agent

A simple WebApp for finding companies and sending automated emails. (e.g. Internships, Work Applications, Partnerships)

## Functionality

Finding and emailing Companies. Researching, writing individual emails and tracking who has already been contacted. This app automates the annoying parts while keeping you in control of what does and doesn't get sent.

User configures it with neded info and targeting criteria. The agent then finds Companies in said Radius, looks up their contact emails, and writes a tailored email for each one. Every draft lands in a review UI where user needs to proof read it, edit if needed, approve it, and send. Nothing gets sent without the users approval!

All contacted companies are stored in a local SQLite database so contact with the same Company doesn't happen twice. And so that you arent perhaps flagged as a spammer bot.

## Explentation

The Agent runs in three phases:

1. **Research** — contacts LLM to generate a list of Companies within user specified radius, based on user industry focus.
2. **Email lookup** — for each Company, contacts LLM for their known public contact email
3. **Draft writing** — writes a tailored email per Company using user's inputted info, tone rules, and self-retrieved Company info.
   Everything runs on users own server. The only external services used are 'OpenRouter' (LLM API, both paid and free options are available) and Gmail SMTP for sending the email. **So if you aren't running local model don't put any sensitive information**

## Requirements

- Node.js
- A free OpenRouter account (API_KEY): [OpenRouter.ai](https://openrouter.ai)
- A Gmail Account with an app password enabled [How to Generate Gmail App Password](https://help.startups.com/knowledge/generate-a-gmail-app-password)

## Installation

**1. Clone or copy the project onto your chosen host (e.g. device/server/vps)**

```bash
git clone https://github.com/CaelusC/Outreach-Agent.git Outreach-Agent
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
nano .env
```

Fill the .env file with the following in the following:

```
OPENROUTER_API_KEY=<sk-or-v1-...>     #On OpenROuter.ai, you can generate an API_KEY
GMAIL_USER=<sily.dilly@gmail.com>
GMAIL_APP_PASSWORD=<xxxx xxxx xxxx xxxx>  # Youll find this on your Google Account
SENDER_NAME=<Your Name>
PORT=3000    #Don't change if you don't know why
```

**4. All prefrences and Info put in here**

```bash
mkdir data
nano data/config.yaml
```

Set your location, search radius, details, sender info, and email tone. Everything the agent needs to know should be in this file.

**5. Run**

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## (Optional) Keeping it running

To run it as a constant background process that would also survive reboots:

```bash
npm install -g pm2
pm2 start src/server.js --name outreach
pm2 save
pm2 startup  # follow what it prints out
```

```bash
pm2 stop
pm2 restart
```

## Usage

1. Open the UI in your browser
2. Check the config preview in the left panel. If any of the info is wrong, edit `data/config.yaml` and restart again.
3. Click **Start Agent**, and read the logs as it runs (_if any errors pop up checkout [Common Issues](#common-issues)_)
4. Drafts appear in the **Needs Review** tab
5. Click a company, read the company info and the generated email, edit if needed and click **+ approve**
6. Approved emails show a **Send** button, click it when you're ready

## Common issues

**Agent error: OpenRouter 503**
The model provider is temporarily down. Wait a few minutes (10-20) and try again. If it keeps doesn't work, switch the model in `src/agent/LLMClient.js`, replace `MODEL` with any other free model id from OpenRouter (Or link to your local model).

**Agent error: OpenRouter 404 — model not found**
The free model ID changed or was removed. Go to [openrouter.ai/models](https://openrouter.ai/models), filter by 0, choose any free one, and update `MODEL` in `src/agent/LLMClient.js` with a valid ID.

**Found 0 companies**
The LLM returned broken JSON or an empty response. Check `pm2 logs outreach`, or just terminal output for the response. Usually caused by a rate limit or a model that doesn't follow JSON instructions well (sometimes free models are a bit stupid) try a different model.

**502 Bad Gateway in the browser**
The Node app isn't running. Check with `pm2 status` and restart with `pm2 restart outreach`.

**Emails show "sending..." after sending one**
Fully reload the page. This is a known UI bug when the drawer doesn't reset state correctly between sends. (was too lazy to fix)

**Gmail authentication error when sending**
Make sure you're using an app password, not your regular Gmail password. Regular passwords don't work with an Agent.

**Config not loading / ENOENT error**
The app expects `data/config.yaml` relative to the project root. Make sure you're running `npm start` from inside the project directory, NOT from some other folder.
