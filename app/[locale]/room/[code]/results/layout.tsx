import type { Metadata } from 'next'

type Props = {
  params: Promise<{ code: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const ogImageUrl = `https://kykmgame.com/api/og?code=${code}`
  
  return {
    title: 'Game Results | Knowing You, Knowing Me',
    description: 'See how well you know each other! Compare your self-perception with how your partner sees you.',
    openGraph: {
      title: 'Knowing You, Knowing Me - Results',
      description: 'How well do you really know each other? Play the perception mirror game!',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Knowing You, Knowing Me - Results',
      description: 'How well do you really know each other?',
      images: [ogImageUrl],
    },
  }
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children
}
