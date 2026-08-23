export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const filename = url.searchParams.get('file');
  
  if (!filename) {
    return new Response('Missing file parameter', { status: 400 });
  }

  const githubUrl = `https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media/${filename}`;

  // Forward Range header if present
  const fetchHeaders = new Headers();
  if (req.headers.has('range')) {
    fetchHeaders.set('range', req.headers.get('range'));
  }

  try {
    const response = await fetch(githubUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Type', 'video/mp4');
    newHeaders.delete('Content-Disposition');
    // Ensure CORS
    newHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    return new Response('Error proxying video', { status: 500 });
  }
}
