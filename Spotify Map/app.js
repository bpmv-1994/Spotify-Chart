var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
(_a = document.getElementById('uploadCsv')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', function (event) {
    var _a;
    var inputElement = event.target;
    var file = (_a = inputElement.files) === null || _a === void 0 ? void 0 : _a[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                var songs = results.data;
                processSimilarity(songs);
            }
        });
    }
});
function computeJaccardSimilarity(setA, setB) {
    var intersection = new Set(__spreadArray([], setA, true).filter(function (item) { return setB.has(item); }));
    var union = new Set(__spreadArray(__spreadArray([], setA, true), setB, true));
    return intersection.size / union.size;
}
function processSimilarity(songs) {
    var maxSongs = 20;
    var subset = getRandomSubset(songs, maxSongs);
    var similarityMatrix = [];
    var attributes = subset.map(function (song) { return new Set([song.Artist, song['Release Date']]); });
    for (var i = 0; i < subset.length; i++) {
        similarityMatrix[i] = [];
        for (var j = 0; j < subset.length; j++) {
            if (i === j) {
                similarityMatrix[i][j] = 1;
            }
            else {
                similarityMatrix[i][j] = computeJaccardSimilarity(attributes[i], attributes[j]);
            }
        }
    }
    renderVisualization(subset, similarityMatrix);
}
function getRandomSubset(array, size) {
    var shuffledArray = array.slice().sort(function () { return 0.5 - Math.random(); });
    return shuffledArray.slice(0, size);
}
function renderVisualization(songs, similarityMatrix) {
    var canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Не удалось найти элемент canvas!');
        return;
    }
    canvas.width = 1920;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст canvas!');
        return;
    }
    var maxRadius = 25;
    var fontSize = 16;
    var textPadding = 15;
    var parseToNumber = function (str) {
        if (typeof str === 'string') {
            return Number(str.replace(/[^0-9.-]+/g, "")) || 0;
        }
        return Number(str) || 0;
    };
    var maxSpotifyStreams = Math.max.apply(Math, songs.map(function (song) { return parseToNumber(song['Spotify Streams']); }));
    var maxYoutubeViews = Math.max.apply(Math, songs.map(function (song) { return parseToNumber(song['YouTube Views']); }));
    var positions = [];
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radiusFactor = 400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < songs.length; i++) {
        var angle = (2 * Math.PI * i) / songs.length;
        var spotifyStreams = parseToNumber(songs[i]['Spotify Streams']);
        var youtubeViews = parseToNumber(songs[i]['YouTube Views']);
        if (!isNaN(spotifyStreams) && !isNaN(youtubeViews)) {
            var x = centerX + radiusFactor * Math.cos(angle) * (1 + spotifyStreams / maxSpotifyStreams);
            var y = centerY + radiusFactor * Math.sin(angle) * (1 + youtubeViews / maxYoutubeViews);
            positions.push({ x: x, y: y });
            var radius = (spotifyStreams / maxSpotifyStreams) * maxRadius + 5;
            var color = "hsla(".concat((i / songs.length) * 360, ", 100%, 50%, 0.8)");
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = "bold ".concat(fontSize, "px Arial");
            ctx.fillText(songs[i]['Track'], x + radius + textPadding, y);
        }
    }
    for (var i = 0; i < songs.length; i++) {
        for (var j = i + 1; j < songs.length; j++) {
            var similarity = similarityMatrix[i][j];
            if (similarity > 0.2) {
                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[j].x, positions[j].y);
                ctx.strokeStyle = "rgba(0, 0, 255, ".concat(similarity * 1.5, ")");
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }
    }
}
