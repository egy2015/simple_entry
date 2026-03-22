import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const newData = await request.json();
    const token = process.env.GH_TOKEN;
    const repo = process.env.GH_REPO;

    console.log("Target Repo:", repo); // Cek di log Vercel munculnya apa
  console.log("Token Exist:", !!token);
    const path = 'public/dataset.json';

    // 1. Ambil SHA file lama (Wajib buat update di GitHub)
    const getFile = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fileData = await getFile.json();
    const sha = fileData.sha;

    // 2. Update file ke GitHub
    const updateFile = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update dataset.json via Dashboard 🚀',
        content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
        sha: sha
      }),
    });

    if (updateFile.ok) {
      return NextResponse.json({ success: true });
    } else {
      const error = await updateFile.json();
      return NextResponse.json({ error }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}