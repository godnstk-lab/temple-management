import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* PWA 설정 */}
        <meta name="application-name" content="해운사" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="해운사" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 테마 색상 */}
        <meta name="theme-color" content="#78350f" />
        <meta name="msapplication-TileColor" content="#78350f" />
        
        {/* 기타 설정 */}
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
