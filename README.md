# 📝 OpenDoc

A collaborative, real-time document editing app built with modern tools and technologies like **Next.js**, **React**, **TypeScript**, **Convex**, **Clerk**, and **Liveblocks**. It replicates key features of Google Docs including real-time editing, user mentions, reactions, and a rich-text editor experience powered by **Tiptap**.

![Google Docs Clone UI](https://github.com/ARtoRiAs10/google-docs-clone/blob/main/.github/images/img_main.png)

---

## 📔 Table of Contents

- [‼️ Folder Structure](#️-folder-structure)
- [🧰 Getting Started](#-getting-started)
- [📸 Screenshots](#-screenshots)
- [⚙️ Tech Stack](#️-tech-stack)
- [📄 License](#-license)
- [🙌 Acknowledgements](#-acknowledgements)

---

## ‼️ Folder Structure

<pre>
google-docs-clone/
├── convex/
│   ├── _generated/
│   ├── .env.example
│   ├── .env.local
│   ├── auth.config.ts
│   ├── documents.ts
│   ├── environment.d.ts
│   ├── schema.ts
├── public/
│   ├── blank-document.svg
│   ├── business-letter.svg
│   ├── cover-letter.svg
│   ├── letter.svg
│   ├── logo.svg
│   ├── project-proposal.svg
│   ├── resume.svg
│   ├── software-proposal.svg
├── src/
│   ├── app/
│   │   ├── (home)/
│   │   ├── api/
│   │   ├── documents/
│   │   ├── apple-icon.png
│   │   ├── error.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── icon1.png
│   │   ├── icon2.png
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── convex-client-provider.tsx
│   │   ├── fullscreen-loader.tsx
│   │   ├── remove-dialog.tsx
│   │   ├── rename-dialog.tsx
│   ├── config/
│   │   ├── editor.ts
│   │   ├── index.ts
│   ├── constants/
│   │   ├── index.ts
│   ├── extensions/
│   │   ├── font-size.ts
│   │   ├── line-height.ts
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-search-param.tsx
│   ├── lib/
│   │   ├── utils.ts
│   ├── store/
│   │   ├── use-editor-store.ts
│   ├── middleware.ts
├── .env.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── .prettierrc.json
├── .prettierrc.mjs
├── bun.lockb
├── components.json
├── environment.d.ts
├── liveblocks.config.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
</pre>

---

## 🧰 Getting Started

### 1. Prerequisites

Ensure the following are installed on your machine:

- [Node.js](https://nodejs.org/)
- Git
- Bun / Yarn / NPM

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/google-docs-clone.git
cd google-docs-clone
```

3. Create .env.local Files
Create the following two files:

  *  `.env.local` (in the root)

  *  `convex/.env.local`

Contents of `.env.local`:
```env
Copy code
NEXT_TELEMETRY_DISABLED=1
CLERK_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"

CONVEX_DEPLOYMENT="dev:<deployment-id>"
NEXT_PUBLIC_CONVEX_URL="https://<deployment-id>.convex.cloud"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CLERK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

NEXT_PUBLIC_LIVEBLOCKS_API_KEY="pk_dev_-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
LIVEBLOCKS_SECRET_KEY="sk_dev_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

Contents of convex/.env.local:
```env
Copy code
CLERK_ISSUER_URL=https://example-id.clerk.accounts.dev
```

🛑 Important: Never commit your .env files to GitHub.

4. Setup Instructions
🌀 Convex Setup:
  *  Visit https://convex.dev

  *  Create or select a deployment

  *  Update `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

🔐 Clerk Auth Setup:
  *  Visit https://clerk.dev

  *  Create a project and get your Publishable and Secret keys

  *  Add `"organization_id": "{{org.id}}"` to a new JWT Template > Convex

  *  Copy the Issuer URL into `.env.local` and `convex/.env.local`

🔄 Liveblocks Setup:
  *  Go to https://liveblocks.io

  *  Get API and Secret keys

  *  Add them to .env.local



5. Install Dependencies

```bash
npm install --legacy-peer-deps
# OR
yarn install --legacy-peer-deps
# OR
bun install --legacy-peer-deps
```
6. Run the App

```bash
npm run dev
# OR
yarn dev
# OR
bun dev
```
✅ The app should now be running at http://localhost:3000

## 📸 Screenshots
 ![Modern UI/UX](https://github.com/ARtoRiAs10/google-docs-clone/blob/main/.github/images/img1.png)

 ![Real-time Tiptap Editor](https://github.com/ARtoRiAs10/google-docs-clone/blob/main/.github/images/img2.png)

 ![Mentions, Replies, and Reactions](https://github.com/ARtoRiAs10/google-docs-clone/blob/main/.github/images/img3.png)

## ⚙️ Tech Stack
  *  Frontend: React.js, Next.js, TypeScript, Tailwind CSS

  *  Backend-as-a-Service: Convex

  *  Authentication: Clerk

  *  Real-time Collaboration: Liveblocks

  *  Deployment: Vercel

## 📄 License
This project is for educational purposes. Please refer to the original authors or license if forking commercially.

## 🙌 Acknowledgements
  *  Inspired by Google Docs

  *  Built using incredible tools :
      *  Convex
      *  Clerk
      *  Liveblocks


