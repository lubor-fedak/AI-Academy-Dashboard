# 🚀 AI Academy 2026 - Setup Guide

This guide will walk you through setting up all the tools you'll need.

**Estimated time:** 15-20 minutes

---

## Step 1: GitHub Account (5 min)

### If you DON'T HAVE a GitHub account:

1. Go to [github.com](https://github.com)
2. Click **Sign up**
3. Use your **work email** (for identification purposes)
4. Username: recommended `first-lastname` or `flastname`

### If you HAVE a GitHub account:

1. Make sure you're signed in
2. Check that you have the correct email set up

---

## Step 2: Create Your Repository (3 min)

### Option A: Fork template (recommended)

1. Go to: `https://github.com/kyndryl-ai-academy/student-template`
2. Click **"Use this template"** → **"Create a new repository"**
3. Name: `ai-academy-2026`
4. Visibility: **Public** (required for dashboard)
5. Click **Create repository**

### Option B: Manual creation

```bash
# Clone the template
git clone https://github.com/kyndryl-ai-academy/student-template.git ai-academy-2026
cd ai-academy-2026

# Change remote to your own repo
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/ai-academy-2026.git
git push -u origin main
```

---

## Step 3: Set Up Webhook (2 min)

This will enable automatic tracking of your submissions on the dashboard.

1. In your repository go to **Settings** → **Webhooks**
2. Click **Add webhook**
3. Fill in:
   - **Payload URL:** `https://ai-academy-dashboard.vercel.app/api/webhook/github`
   - **Content type:** `application/json`
   - **Secret:** `[you'll get this from your mentor]`
   - **Events:** Select **"Just the push event"**
4. Click **Add webhook**

✅ Now every push to the repository will be automatically tracked!

---

## Step 4: Fill In Your Details (2 min)

1. Open the `README.md` file in your repository
2. Fill in the **"About Me"** section:
   ```markdown
   ## 👤 About Me

   | | |
   |---|---|
   | **Name** | Jane Doe |
   | **Role** | FDE |
   | **Team** | Alpha |
   | **Stream** | Tech |
   ```
3. Commit and push:
   ```bash
   git add README.md
   git commit -m "Add my info"
   git push
   ```

---

## Step 5: Register in the Dashboard (1 min)

1. Go to: `https://ai-academy-dashboard.vercel.app/register`
2. Fill in the form:
   - GitHub username
   - Name
   - Email
   - Role (select from dropdown)
   - Team (assigned by mentor)
3. Click **Register**

✅ You should appear on the leaderboard!

---

## Step 6: Test Submission (2 min)

Let's verify everything works:

1. Open the file `day-01-agent-foundations/README.md`
2. Add something (e.g., your name)
3. Commit and push:
   ```bash
   git add .
   git commit -m "Test submission"
   git push
   ```
4. Go to the dashboard → You should see your activity!

---

## 🔧 Troubleshooting

### Webhook not working

- Check that the URL is correct
- Check that the secret is correct (get from mentor)
- Check **Recent Deliveries** in GitHub webhook settings

### Can't see myself on the dashboard

- Make sure you registered
- Make sure your GitHub username is spelled correctly

### Can't push

```bash
# If you don't have permissions, try:
git remote set-url origin https://YOUR-USERNAME@github.com/YOUR-USERNAME/ai-academy-2026.git
```

---

## 📱 Quick Links

| Tool | URL |
|------|-----|
| Dashboard | `https://ai-academy-dashboard.vercel.app` |
| Template repo | `https://github.com/kyndryl-ai-academy/student-template` |
| Webhook URL | `https://ai-academy-dashboard.vercel.app/api/webhook/github` |
| MS Teams #ai-academy-help | [link] |

---

## ✅ Checklist

- [ ] GitHub account created/verified
- [ ] Repository `ai-academy-2026` created
- [ ] Webhook set up
- [ ] Details in README filled in
- [ ] Dashboard registration complete
- [ ] Test push successful

**You're ready for Day 1!** 🎉

---

*If you have problems, post in MS Teams #ai-academy-help or contact your mentor.*
