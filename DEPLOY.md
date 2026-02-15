
# 🚀 Deployment Guide for Scribble Squad

This guide will help you deploy your game to the internet using **Render.com** (recommended for ease of use with Node.js & Socket.io). It works great on the free tier!

## 1. Prepare Your Code in GitHub
Ensure all your latest changes are pushed to your GitHub repository.
1. Create a `New Repository` on GitHub.
2. Push your local code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/scribble-squad.git
   git branch -M main
   git push -u origin main
   ```

## 2. Deploy on Render
1. Sign up/Login to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Use the following settings:
   - **Name**: `scribble-squad` (or whatever you like)
   - **Region**: Closest to you (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `.` (leave blank)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: `Free`

5. Click **Create Web Service**.

## 3. Environment Variables (Optional)
Render automatically sets the `PORT` variable, and your server code is already set up to use it:
```javascript
const PORT = process.env.PORT || 3001;
```
So you don't need to do anything extra here!

## 4. Play!
Once the deployment finishes (usually 1-2 minutes), Render will give you a URL like:
`https://scribble-squad.onrender.com`

Share this link with your friends. They can join from their phones or laptops anywhere in the world! 🌍

---
## Troubleshooting
- **Socket Connection Issues**: If the game loads but says "Searching for connection...", ensure your `src/lib/socket.js` is using `window.location.origin` (I have already updated this for you).
- **Slow Free Tier**: The Render free tier "spins down" after 15 minutes of inactivity. The first person to join might have to wait 30-50 seconds for the server to wake up. This is normal for free hosting.
