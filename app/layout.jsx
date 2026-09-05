import './globals.css';

export const metadata = {
  title: 'DC Shift Manager | ระบบจัดการตารางกะศูนย์ข้อมูล 24/7',
  description: 'ระบบกำหนดและบริหารจัดการตารางกะเจ้าหน้าที่ศูนย์ข้อมูล Data Center 24/7 Mission Critical',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
