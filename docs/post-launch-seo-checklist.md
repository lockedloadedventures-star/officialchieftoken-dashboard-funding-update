# Post-Launch SEO Checklist

## 1) Search Console Setup

- Open Google Search Console and add property: `https://officialchieftoken.com/`.
- In property verification, copy the meta token value.
- Update `index.html` meta tag `google-site-verification` content.
- Deploy to production.
- Click Verify in Search Console.
- Submit sitemap: `https://officialchieftoken.com/sitemap.xml`.

## 2) Bing Webmaster Setup

- Open Bing Webmaster Tools and add site: `https://officialchieftoken.com/`.
- Copy the `msvalidate.01` token value.
- Update `index.html` meta tag `msvalidate.01` content.
- Deploy to production.
- Click Verify in Bing Webmaster Tools.
- Submit sitemap: `https://officialchieftoken.com/sitemap.xml`.

## 3) Redirect + Canonical Validation

- `https://www.officialchieftoken.com` must return permanent redirect to apex.
- Canonical tag must be `https://officialchieftoken.com/`.
- `og:url` should be `https://officialchieftoken.com/`.

## 4) Indexing Health Checks

- Confirm `robots.txt` is accessible.
- Confirm `sitemap.xml` is accessible.
- Run URL Inspection on homepage after verification.

## 5) Recommended Commit Bundle

Use one commit for all domain and SEO launch hardening:

```
feat(seo): finalize custom-domain launch hardening

- enforce permanent www->apex redirect in vercel.json
- normalize canonical/Open Graph/Twitter image URLs to official domain
- update robots.txt and sitemap.xml to apex domain
- add JSON-LD WebSite + Organization schema
- add Search Console and Bing verification tag placeholders
- verify live responses (apex 200, www 308)
```
