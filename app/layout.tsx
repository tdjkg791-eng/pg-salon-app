import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pg. サロン管理',
  description: 'Pg. 式ダイエットサロンの顧客管理・食事記録アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
