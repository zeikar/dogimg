# DOGimg

A Dynamic Open Graph Image Generator with URL.

Generate stunning Open Graph Images for your website with just a URL using DOGimg API. Our API makes it easy to create eye-catching images for social media sharing and SEO optimization.

# Try it Out

Check out our demo at https://dogimg.vercel.app. Simply input the URL of the website you want to generate an image for, and let DOGimg do the rest.

<p align="center">
  <img height="300" src="https://user-images.githubusercontent.com/7712035/234559726-d7f361ed-f0c6-432a-86f0-4c0fde63edb7.png">
</p>

Here are some examples of images generated by DOGimg:

|                                                 https://dogimg.vercel.app                                                  |                                                 https://github.com                                                  |
| :------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------: |
| ![dogimg.vercel.app](https://user-images.githubusercontent.com/7712035/216802949-c1547ee3-3795-4cc5-9b34-4e9b8528c858.png) | ![github.com](https://user-images.githubusercontent.com/7712035/216802950-335f096a-ed1b-42f3-83e5-d73147144d4f.png) |

|                                                 https://nextjs.org                                                  |                                                 https://vercel.com                                                  |
| :-----------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------: |
| ![nextjs.org](https://user-images.githubusercontent.com/7712035/216802951-8800ea03-2bd1-4839-9ef1-a2f73fa712bd.png) | ![vercel.com](https://user-images.githubusercontent.com/7712035/216802952-932b4d79-bb9b-496f-8a67-c8e5130e4b2b.png) |

# How to Use

## Meta tags

Add the following meta tags to your HTML to display the generated image:

```html
<meta
  property="og:image"
  content="https://dogimg.vercel.app/api/og?url={YOUR_URL}"
/>
<!-- optional -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

## API

You can also access the DOGimg API directly with the following URL format:

```
https://dogimg.vercel.app/api/og?url={YOUR_URL}
```

# Run DOGimg Locally

To run DOGimg on your own machine, follow these steps:

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open http://localhost:3000 in your browser to see the result.

You can also try the API by visiting http://localhost:3000/api/og?url=https://github.com

# How it Works

DOGimg works by fetching the HTML of the URL you provide, extracting the title, description, and favicon, and finally generating an image with that information.

# License

This project is licensed under the MIT License. You can find the details in the [LICENSE](LICENSE) file.

# Recognition

DOGimg wouldn't be possible without the support from the following projects:

- [og-image](https://www.npmjs.com/package/@vercel/og)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [tailwindcss](https://tailwindcss.com/)
- [ChatGPT](https://chat.openai.com/)
