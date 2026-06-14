const https = require('https');

const SYSTEM = `Tu es l'assistant IA intégré au portfolio de Credo Ahiafor.
Réponds de façon concise, amicale et professionnelle sur Credo.
Si on te pose des questions hors sujet, redirige poliment.
Réponds en français sauf si l'utilisateur parle anglais.

== Profil de Credo ==
Nom : Credo Ahiafor
Rôle : Ingénieur Réseaux & Sécurité · Développeur Web Full-Stack
Localisation : Segbé-Zanvi, Lomé, Togo 🇹🇬
Email : ahiafor.credo@gmail.com | Téléphone : +228 92 23 63 79
GitHub : GRIIINDER | LinkedIn : credoahiafor
Formation : Master 2 SRS (Sécurité Réseaux & Systèmes) — ESGIS Lomé 2026
Expérience : 5+ ans en réseaux, cybersécurité et développement web
Disponibilité : Ouvert aux missions freelance et opportunités CDI/CDD

== Stack ==
Réseaux : Cisco, VLAN, VPN, Wireshark, Datacenter, Virtualisation
Sécurité : CEH, CCNP Security, pare-feu, cryptographie, audit réseau
Dev Web : React, WordPress, Shopify, HTML/CSS/JS, Python
Cloud/OS : Azure, Linux, Windows Server, Git`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const messages = [
    ...(Array.isArray(history) ? history.slice(-6) : []),
    { role: 'user', content: message }
  ];

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM,
    messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  try {
    const reply = await new Promise((resolve, reject) => {
      const r = https.request(options, resp => {
        let data = '';
        resp.on('data', c => data += c);
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message));
            resolve(parsed.content?.[0]?.text || '…');
          } catch (e) { reject(e); }
        });
      });
      r.on('error', reject);
      r.write(body);
      r.end();
    });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
