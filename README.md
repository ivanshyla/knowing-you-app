# Knowing You, Knowing Me 💞

A fun and interactive quiz app for couples and friends to discover how well they know each other!

## 🎯 Features

- **Real-time gameplay** - Both players answer questions simultaneously on their devices
- **Beautiful UI** - Mobile-first design with gradient backgrounds and smooth animations
- **Multiple question packs** - Light, funny, and deep questions to choose from
- **Interactive results** - Radar charts, top matches, and differences analysis
- **Share cards** - Generate beautiful images to share on social media
- **Private rooms** - Each session has a unique 6-digit code

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account (free tier works perfectly)

### Installation

1. **Navigate to the project folder:**
   ```bash
   cd knowing-you
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to Project Settings > API and copy your project URL and anon key
   
   c. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set up the database:**
   
   Go to the SQL Editor in your Supabase dashboard and run the SQL from `SUPABASE_SETUP.sql`

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Play

1. **Create a room** - Choose a question pack and enter your name
2. **Share the code** - Give the 6-digit code to your friend
3. **Wait in lobby** - Both players join and start together
4. **Answer questions** - Rate yourself and your partner on each question (1-10 scale)
5. **View results** - See how well you know each other with charts and insights
6. **Share** - Download a beautiful card to share on social media

## 🗂️ Project Structure

```
knowing-you/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── room/
│   │   ├── create/
│   │   │   └── page.tsx           # Create room page
│   │   └── [code]/
│   │       ├── page.tsx           # Lobby page
│   │       ├── questions/
│   │       │   └── page.tsx       # Questions page
│   │       └── results/
│   │           └── page.tsx       # Results page
│   └── api/
│       ├── create-room/
│       │   └── route.ts          # Create room API
│       ├── join-room/
│       │   └── route.ts          # Join room API
│       ├── start-session/
│       │   └── route.ts          # Start session API
│       └── submit-rating/
│           └── route.ts          # Submit rating API
├── components/
│   └── ShareCard.tsx             # Share card component
├── data/
│   └── questionPacks.ts          # Question packs data
├── lib/
│   ├── supabase.ts               # Supabase client & types
│   └── utils.ts                  # Utility functions
└── SUPABASE_SETUP.sql            # Database schema
```

## 🎨 Customization

### Adding Question Packs

Edit `data/questionPacks.ts` to add new question packs:

```typescript
export const QUESTION_PACKS = {
  yourpack: {
    id: 'yourpack',
    name: 'Your Pack Name',
    description: 'Description here',
    questions: [
      { text: 'Question text', icon: '😊' },
      // Add more questions...
    ],
  },
}
```

### Customizing Themes

The app uses Tailwind CSS. Edit the gradient colors in pages to match your brand:

```typescript
// Change this:
className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"

// To your colors:
className="bg-gradient-to-br from-your-color-1 via-your-color-2 to-your-color-3"
```

## 🔒 Security & Privacy

For the MVP, RLS (Row Level Security) is enabled but set to allow all operations. Before deploying to production:

1. Update RLS policies in Supabase to restrict access
2. Add user authentication if needed
3. Implement rate limiting on API routes
4. Add session expiration logic

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (database + real-time)
- **Recharts** - Data visualization
- **html2canvas** - Image generation

## 📊 Database Schema

- **sessions** - Game sessions with unique codes
- **participants** - Players (A and B) in each session
- **questions** - Questions for each session (copied from packs)
- **ratings** - Individual ratings (who rated whom on what)

## 🐛 Troubleshooting

**"Комната не найдена" error:**
- Make sure your Supabase credentials are correct in `.env.local`
- Check that the database tables were created successfully

**Real-time not working:**
- Verify that your Supabase project has real-time enabled (it's on by default)
- Check browser console for connection errors

**Charts not displaying:**
- Make sure you have at least 4 ratings per question
- Check that recharts is properly installed

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

The app works on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 Future Enhancements

- [ ] User accounts and session history
- [ ] More question packs
- [ ] Async mode (answer questions at different times)
- [ ] Gallery of shared cards
- [ ] Custom question creator
- [ ] Multi-language support
- [ ] PWA support for mobile installation

## 🤝 Contributing

Feel free to fork this project and make it your own! Some ideas:
- Add new question packs
- Improve the UI/UX
- Add animations
- Create new share card themes
- Add analytics

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes!

## 💖 Credits

Made with 💜 for curious minds who want to know each other better.

---

**Ready to discover how well you know each other? Let's play! 🎮**
