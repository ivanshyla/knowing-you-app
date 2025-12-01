# 🚀 SETUP GUIDE - Knowing You, Knowing Me

## Step-by-Step Setup Instructions

### 1️⃣ Install Dependencies

The project is already created! Now just install packages:

```bash
cd knowing-you
npm install
```

This will install:
- Next.js & React
- Supabase client
- Recharts (for charts)
- html2canvas (for image generation)
- Tailwind CSS
- TypeScript

---

### 2️⃣ Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose:
   - Organization: Your organization
   - Name: knowing-you-app (or any name)
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to you
4. Click "Create new project" (takes ~2 minutes)

---

### 3️⃣ Get Your Supabase Credentials

1. Once your project is created, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see:
   - **Project URL** - Copy this
   - **anon/public key** - Copy this

---

### 4️⃣ Create Environment File

1. In the `knowing-you` folder, create a file called `.env.local`
2. Add these lines (replace with YOUR credentials):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

**Important:** Replace the values with YOUR actual URL and key from step 3!

---

### 5️⃣ Set Up Database Tables

1. In Supabase dashboard, click on **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Open the file `SUPABASE_SETUP.sql` in your project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: "Success. No rows returned"

This creates:
- ✅ 4 tables (sessions, participants, questions, ratings)
- ✅ Row Level Security policies
- ✅ Indexes for performance

---

### 6️⃣ Verify Database Setup

1. Click on **Table Editor** in Supabase sidebar
2. You should see 4 tables:
   - sessions
   - participants
   - questions
   - ratings

If you see all 4, you're good to go! ✅

---

### 7️⃣ Run the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in XXXms
```

---

### 8️⃣ Test the App

1. Open http://localhost:3000 in your browser
2. You should see the landing page with "Knowing You, Knowing Me 💞"
3. Click "Начать игру 🚀"
4. Choose a question pack
5. Enter your name and emoji
6. Click "Создать комнату"
7. You'll get a 6-digit code!

---

### 9️⃣ Test with Two Players

**Option 1: Two Devices**
- Open the room code on your phone
- Join as the second player

**Option 2: Two Browser Windows**
- Open a new incognito/private window
- Go to http://localhost:3000
- Enter the room code (you can type it in the URL: http://localhost:3000/room/YOUR_CODE)
- Join as second player

---

### 🎮 Play the Game!

1. Wait in lobby until both players join
2. Click "Начать игру!"
3. Both players answer questions (rate yourself and your partner 1-10)
4. After all questions, see your results!
5. Generate a share card

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to create room"
**Solution:** Check your `.env.local` file has correct Supabase credentials

### Issue: "Комната не найдена"
**Solution:** Make sure database tables were created (step 5-6)

### Issue: Real-time not working (stuck on "Waiting for partner")
**Solution:** 
- Check Supabase dashboard > Project Settings > API > Enable Realtime
- Refresh the page

### Issue: Charts not showing on results page
**Solution:** Make sure you answered ALL questions (both players)

### Issue: Port 3000 already in use
**Solution:** 
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

---

## ✅ Checklist

Before deploying or sharing:

- [ ] Tailwind CSS working ✅
- [ ] Supabase connected ✅
- [ ] Database tables created ✅
- [ ] Can create a room ✅
- [ ] Can join a room ✅
- [ ] Real-time updates work ✅
- [ ] Can answer questions ✅
- [ ] Results page shows charts ✅
- [ ] Can download share card ✅

---

## 🚀 Ready to Deploy?

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Done! Share your link!

---

## 📞 Need Help?

- Check the main README.md for more details
- Review the code comments
- Check Supabase documentation
- Make sure all environment variables are set correctly

---

**Happy Playing! 💞**




