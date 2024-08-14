interface Song {
    Artist: string;
    'Release Date': string;
    'Spotify Streams': string;
    'YouTube Views': string;
    Track: string;
}

document.getElementById('uploadCsv')?.addEventListener('change', function(event) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                const songs: Song[] = results.data as Song[];
                processSimilarity(songs);
            }
        });
    }
});

function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(item => setB.has(item)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

function processSimilarity(songs: Song[]): void {
    const maxSongs = 20;
    const subset = getRandomSubset(songs, maxSongs);
    const similarityMatrix: number[][] = [];
    const attributes = subset.map(song => new Set([song.Artist, song['Release Date']]));

    for (let i = 0; i < subset.length; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < subset.length; j++) {
            if (i === j) {
                similarityMatrix[i][j] = 1;
            } else {
                similarityMatrix[i][j] = computeJaccardSimilarity(attributes[i], attributes[j]);
            }
        }
    }

    renderVisualization(subset, similarityMatrix);
}

function getRandomSubset<T>(array: T[], size: number): T[] {
    const shuffledArray = array.slice().sort(() => 0.5 - Math.random());
    return shuffledArray.slice(0, size);
}

function renderVisualization(songs: Song[], similarityMatrix: number[][]): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Не удалось найти элемент canvas!');
        return;
    }

    canvas.width = 1920;
    canvas.height = 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст canvas!');
        return;
    }

    const maxRadius = 25;
    const fontSize = 16;
    const textPadding = 15;

    const parseToNumber = (str: string | number): number => {
        if (typeof str === 'string') {
            return Number(str.replace(/[^0-9.-]+/g, "")) || 0;
        }
        return Number(str) || 0;
    };

    const maxSpotifyStreams = Math.max(...songs.map(song => parseToNumber(song['Spotify Streams'])));
    const maxYoutubeViews = Math.max(...songs.map(song => parseToNumber(song['YouTube Views'])));
    const positions: { x: number; y: number }[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radiusFactor = 400;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < songs.length; i++) {
        const angle = (2 * Math.PI * i) / songs.length;

        const spotifyStreams = parseToNumber(songs[i]['Spotify Streams']);
        const youtubeViews = parseToNumber(songs[i]['YouTube Views']);

        if (!isNaN(spotifyStreams) && !isNaN(youtubeViews)) {
            const x = centerX + radiusFactor * Math.cos(angle) * (1 + spotifyStreams / maxSpotifyStreams);
            const y = centerY + radiusFactor * Math.sin(angle) * (1 + youtubeViews / maxYoutubeViews);
            positions.push({ x, y });

            const radius = (spotifyStreams / maxSpotifyStreams) * maxRadius + 5;
            const color = `hsla(${(i / songs.length) * 360}, 100%, 50%, 0.8)`;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(songs[i]['Track'], x + radius + textPadding, y);
        }
    }

    for (let i = 0; i < songs.length; i++) {
        for (let j = i + 1; j < songs.length; j++) {
            const similarity = similarityMatrix[i][j];
            if (similarity > 0.2) {
                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[j].x, positions[j].y);
                ctx.strokeStyle = `rgba(0, 0, 255, ${similarity * 1.5})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }
    }
}
