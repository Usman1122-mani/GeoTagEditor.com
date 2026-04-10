const fs = require('fs');
const path = require('path');

const files = [
    'remove-gps-data.html',
    'photo-metadata-guide.html',
    'social-network-geotags.html',
    'real-estate-geotagging.html',
    'gps-coordinate-formats.html'
];

const cssToInject = `
        .article-content h2 { font-size: 1.875rem; font-weight: 800; color: #111827; margin-top: 2.5rem; margin-bottom: 1.25rem; line-height: 1.3; }
        .article-content h3 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-top: 2rem; margin-bottom: 1rem; }
        .article-content p { font-size: 1.125rem; color: #374151; line-height: 1.8; margin-bottom: 1.5rem; }
        .article-content ul { list-style-type: disc; list-style-position: outside; margin-bottom: 1.5rem; font-size: 1.125rem; color: #374151; margin-left: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; padding-left: 0.25rem; }
        .article-content strong { font-weight: 700; color: #111827; }
        .article-content a { color: #4f46e5; text-decoration: underline; font-weight: 600; }
    </style>
`;

files.forEach(f => {
    const p = path.join(__dirname, 'blog', f);
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes('.article-content h2')) {
        console.log(`Skipping ${f}, already has CSS.`);
        return;
    }
    c = c.replace('    </style>', cssToInject);
    fs.writeFileSync(p, c, 'utf8');
    console.log(`Injected into ${f}`);
});
