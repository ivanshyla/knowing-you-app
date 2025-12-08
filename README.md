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
- AWS account with permission to create DynamoDB tables (free tier works)
- AWS CLI configured locally (`aws configure`) or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars

### Installation

1. **Navigate to the project folder:**
   ```bash
   cd knowing-you
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure AWS credentials:**

   - For local development you can either export env vars  
     (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)  
     or run `aws configure` once.
   - The app expects the following DynamoDB tables (auto-created in prod, or create manually for local dev):
     - `kykm_sessions`
     - `kykm_participants`
     - `kykm_questions`
     - `kykm_ratings`
   - To override table names, set `AWS_DDB_SESSIONS_TABLE`, `AWS_DDB_PARTICIPANTS_TABLE`, etc.

4. **(Optional) Override AWS region:**

   The default region is `eu-north-1`. Set `AWS_REGION` if you use a different one.

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
│       ├── create-room/          # Create room API
│       ├── join-room/            # Join room API
│       ├── start-session/        # Host starts the game
│       ├── finish-session/       # Mark session as completed
│       ├── submit-rating/        # Persist rating values
│       └── room/
│           └── state/            # Pollable room state (session, players, ratings)
├── components/
│   └── ShareCard.tsx             # Share card component
├── data/
│   └── questionPacks.ts          # Question packs data
├── lib/
│   ├── models.ts                 # Shared TypeScript models
│   ├── sessionStore.ts           # DynamoDB helper functions
│   └── utils.ts                  # Utility functions
└── deploy/                       # Elastic Beanstalk artifacts
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

For the MVP every session lives in your own AWS account (DynamoDB). To harden production:

1. Attach a least-privilege IAM role to the Elastic Beanstalk/EC2 instance (read + write for the four `kykm_*` tables only).
2. Enable DynamoDB TTL or a scheduled cleanup Lambda so finished rooms disappear after N hours.
3. Add authentication or signed room tokens if you need more than ad-hoc 1:1 games.
4. Introduce API rate limiting (Lambda@Edge, CloudFront, or a tiny middleware) to protect against brute-force room-code scans.

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **AWS DynamoDB** - Backend storage
- **Recharts** - Data visualization
- **html2canvas** - Image generation

## 📊 Data Model

All game data lives in DynamoDB (one table per entity):

- `kykm_sessions` — game session metadata with the short code
- `kykm_participants` — two records (roles A/B) per session
- `kykm_questions` — questions cloned from the selected pack
- `kykm_ratings` — every 1–10 rating (who rated whom on which question)

## 🐛 Troubleshooting

**"Комната не найдена" error:**
- Ensure the AWS credentials you provided have DynamoDB read/write permissions
- Confirm that the `kykm_sessions` table exists in the region you configured

**No updates in лобби / вопросы:**
- The polling endpoints rely on DynamoDB – double-check the table contains the newly created session
- Verify that the EC2/Elastic Beanstalk instance role has DynamoDB permissions

**Charts not displaying:**
- Make sure you have at least 4 ratings per question
- Check that recharts is properly installed

## 🚀 Deployment

### Deploy to AWS Elastic Beanstalk (recommended)

1. Build the standalone bundle (`npm run build`)
2. Zip `.next/standalone` + `.next/static` + `public`
3. Upload via `eb deploy` (see `/deploy` folder for examples)
4. The application reads DynamoDB using the instance role, so no secrets are stored on disk

You can still deploy to Vercel/Netlify/etc., just make sure those platforms have IAM users with access to the DynamoDB tables.

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
