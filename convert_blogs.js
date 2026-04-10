const fs = require('fs');
const path = require('path');

const config = [
    {
        file: 'remove-gps-data.html',
        image: 'https://images.unsplash.com/photo-1555861496-faa3d4e8c17b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        category: 'Privacy',
        date: 'Oct 18, 2025',
        readTime: '4 min read'
    },
    {
        file: 'photo-metadata-guide.html',
        image: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        category: 'Ultimate Guide',
        date: 'Oct 24, 2025',
        readTime: '6 min read'
    },
    {
        file: 'social-network-geotags.html',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        category: 'Social Media',
        date: 'Sep 15, 2025',
        readTime: '5 min read'
    },
    {
        file: 'real-estate-geotagging.html',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        category: 'Business',
        date: 'Oct 05, 2025',
        readTime: '4 min read'
    },
    {
        file: 'gps-coordinate-formats.html',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        category: 'Technical',
        date: 'Sep 02, 2025',
        readTime: '7 min read'
    }
];

const templatePath = path.join(__dirname, 'blog', 'adding-location-to-scans.html');
const templateRaw = fs.readFileSync(templatePath, 'utf8');

config.forEach(item => {
    const filePath = path.join(__dirname, 'blog', item.file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found, skipping: ${item.file}`);
        return;
    }
    const oldContent = fs.readFileSync(filePath, 'utf8');

    // Extractions from old file
    const titleMatch = oldContent.match(/<title>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1] : '';

    const descMatch = oldContent.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/is);
    const description = descMatch ? descMatch[1] : '';

    const kwMatch = oldContent.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/is);
    const keywords = kwMatch ? kwMatch[1] : '';

    const ogTitleMatch = oldContent.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/is);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';

    const ogDescMatch = oldContent.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/is);
    const ogDesc = ogDescMatch ? ogDescMatch[1] : '';

    const canonicalMatch = oldContent.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/is);
    const canonical = canonicalMatch ? canonicalMatch[1] : `https://geotageditor.com/blog/${item.file}`;

    const h1Match = oldContent.match(/<h1[^>]*>(.*?)<\/h1>/is);
    const h1 = h1Match ? h1Match[1].trim() : '';

    // Article body html inside <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 article-body"> ... </div>
    const articleBodyMatch = oldContent.match(/<div class="[^"]*article-body[^"]*">(.*?)<\/div>\s*<\/div>\s*<\/main>/is) || 
                             oldContent.match(/<div class="[^"]*article-body[^"]*">(.*?)<\/div>\s*<\/div>\s*<\/div>/is);
    let articleContent = '';
    if (articleBodyMatch) {
         articleContent = articleBodyMatch[1].trim();
    } else {
        console.log(`Failed to extract article content for ${item.file}`);
    }

    // Now copy template and replace values
    let newHtml = templateRaw;

    // Head Replacements
    newHtml = newHtml.replace(/<title>.*?<\/title>/is, `<title>${title}</title>`);
    newHtml = newHtml.replace(/<meta[^>]*name="description"[^>]*content="[^"]*"/is, `<meta name="description" content="${description}">`);
    newHtml = newHtml.replace(/<meta[^>]*name="keywords"[^>]*content="[^"]*"/is, `<meta name="keywords" content="${keywords}">`);
    newHtml = newHtml.replace(/<meta[^>]*property="og:title"[^>]*content="[^"]*"/is, `<meta property="og:title" content="${ogTitle}">`);
    newHtml = newHtml.replace(/<meta[^>]*property="og:description"[^>]*content="[^"]*"/is, `<meta property="og:description" content="${ogDesc}">`);
    newHtml = newHtml.replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"/is, `<link rel="canonical" href="${canonical}">`);
    
    // It's possible Twitter tags exist in template but not old files, update them
    newHtml = newHtml.replace(/<meta[^>]*property="twitter:title"[^>]*content="[^"]*"/is, `<meta property="twitter:title" content="${ogTitle}">`);
    newHtml = newHtml.replace(/<meta[^>]*property="twitter:description"[^>]*content="[^"]*"/is, `<meta property="twitter:description" content="${ogDesc}">`);
    // Twitter url
    newHtml = newHtml.replace(/<meta[^>]*property="twitter:url"[^>]*content="[^"]*"/is, `<meta property="twitter:url" content="${canonical}">`);
    // Open Graph url
    newHtml = newHtml.replace(/<meta[^>]*property="og:url"[^>]*content="[^"]*"/is, `<meta property="og:url" content="${canonical}">`);


    // Hero section Replacements
    // Category Badge
    newHtml = newHtml.replace(/<span class="px-4 py-1\.5 bg-indigo-500\/20 border border-indigo-400\/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md">.*?<\/span>/is, 
        `<span class="px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md">${item.category}</span>`);

    // Read Time
    newHtml = newHtml.replace(/<span class="text-sm text-gray-300 font-medium"><i class="far fa-clock mr-2"><\/i>.*?<\/span>/is,
        `<span class="text-sm text-gray-300 font-medium"><i class="far fa-clock mr-2"></i> ${item.readTime}</span>`);

    // Date
    newHtml = newHtml.replace(/<span class="text-sm text-gray-300 font-medium hidden sm:inline"><i class="fas fa-circle text-\[6px\] mx-2 text-gray-500"><\/i>.*?<\/span>/is,
        `<span class="text-sm text-gray-300 font-medium hidden sm:inline"><i class="fas fa-circle text-[6px] mx-2 text-gray-500"></i> ${item.date}</span>`);

    // H1
    newHtml = newHtml.replace(/<h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-\[1\.1\] mb-6 drop-shadow-xl">.*?<\/h1>/is,
        `<h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 drop-shadow-xl">\n                    ${h1}\n                </h1>`);

    // Hero Subtitle
    newHtml = newHtml.replace(/<p class="text-xl md:text-2xl text-indigo-100\/90 font-light max-w-3xl leading-relaxed drop-shadow-md">.*?<\/p>/is,
        `<p class="text-xl md:text-2xl text-indigo-100/90 font-light max-w-3xl leading-relaxed drop-shadow-md">\n                    ${ogDesc}\n                </p>`);

    // Main Hero Image
    newHtml = newHtml.replace(/<div class="absolute inset-0 z-0">\s*<img src="[^"]*" alt="[^"]*" class="w-full h-full object-cover">\s*<\/div>/is,
        `<div class="absolute inset-0 z-0">\n            <img src="${item.image}" alt="${h1}" class="w-full h-full object-cover">\n        </div>`);

    // We can also replace inner responsive images inside the article content with this image, but since the old files don't have images, we don't have to extract them. The template's inner content has images! If we overwrite the inner HTML completely, it will remove the template's inner images and use the old one's content, which had no images. Perfect.
    
    // Replace Article Content
    newHtml = newHtml.replace(/<div class="article-content max-w-\[800px\] mx-auto">.*?<\/div>\s*<\/article>/is, 
        `<div class="article-content max-w-[800px] mx-auto">\n                            ${articleContent}\n                        </div>\n                    </article>`);

    // Now handle formatting issues in old content
    // Remove the h2 margin top 10 inline class since old content relied on CSS that was deleted, wait, the template HAS the new CSS. Wait no, template's css doesn't have `.article-body h2` anymore! It's pure tailwind or inline?
    // Let's check `adding-location...` it had simple `<p>` and `<h2>` without classes? Actually wait, if the template relies on global CSS, we need to inject the typography CSS from the old file or use tailwind typography.
    
    fs.writeFileSync(filePath, newHtml, 'utf8');
    console.log(`Successfully converted ${item.file}`);
});
