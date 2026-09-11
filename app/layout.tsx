import type { Metadata } from 'next';
import '@/features/wiki/figma.css';

export const metadata: Metadata = {
  title: 'NJFU Wiki · 让经验被看见',
  description: '面向南京林业大学学生的资料发现与个人发展导学平台。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
