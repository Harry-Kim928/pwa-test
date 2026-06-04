export default function handler(_req, res) {
  res.json({
    status: 'ok',
    naverConfigured: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  })
}
