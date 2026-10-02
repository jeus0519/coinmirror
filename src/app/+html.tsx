import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { buildCoinmirrorMetadata } from '../lib/seo-metadata';

export default function Root({ children }: PropsWithChildren) {
  const metadata = buildCoinmirrorMetadata();
  const ogImage = metadata.openGraph.images[0];
  const twitterImage = metadata.twitter.images[0];

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href={metadata.alternates.canonical} />
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:locale" content={metadata.openGraph.locale} />
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:image" content={ogImage.url} />
        <meta property="og:image:width" content={String(ogImage.width)} />
        <meta property="og:image:height" content={String(ogImage.height)} />
        <meta property="og:image:alt" content={ogImage.alt} />
        <meta name="twitter:card" content={metadata.twitter.card} />
        <meta name="twitter:title" content={metadata.twitter.title} />
        <meta name="twitter:description" content={metadata.twitter.description} />
        <meta name="twitter:image" content={twitterImage} />
      </head>
      <body>{children}</body>
    </html>
  );
}
