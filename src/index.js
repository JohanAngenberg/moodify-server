import express from 'express';
import SpotifyAPI from './spotifyAPI';
//import { request } from 'https';
const app = express();
const request = require('request');
const querystring = require('querystring');
const client_id = ''/* insert spoptify client-id here*/;
const client_secret = ''/* insert spoptify client-secret here*/;
const spotifyAPI = new SpotifyAPI(client_id, client_secret);
const redirect_uri = 'http://localhost:3001/callback';

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    const queryString = 'dream*&type=artist';
    spotifyAPI.searchRequest(queryString)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.send(err);
        });
});

app.get('/artists', (req, res) => {
    spotifyAPI.artistRequest()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.send(err);
        });
});

app.get('/playlist/:id', (req, res) => {
    spotifyAPI.playlistRequest(req.params.id)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            console.log(err);
        });
});

app.get('/audio-features/:playlist_id', (req, res) => {
    spotifyAPI.getAccessToken();
    spotifyAPI.audioFeaturesOfPlaylist(req.params.playlist_id)
        .then(data => res.send(data))
        .catch(err => res.send([]));
});

app.post('/create-playlist/:user_id/:name/:user_token', (req, res) => {
    spotifyAPI.newPlaylist(req.params.user_id, req.params.name, req.params.user_token)
        .then(data => res.send(data))
        .catch(err => console.log(err));
});

app.post('/add-tracks/:playlist_id/:tracks/:user_token', (req, res) => {
    console.log(req.params.playlist_id);
    console.log(req.params.tracks);
    spotifyAPI.addTracks(req.params.playlist_id, req.params.tracks, req.params.user_token)
        .then(data => res.send(data))
        .catch(err => console.log(err));
});

app.get('/login', (req, res) => {
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id,
            scope: 'user-read-private playlist-modify-public playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative',
            redirect_uri
        }))
});

app.get('/callback', (req, res) => {
    let code = req.query.code || null;
    let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code,
            redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(
                client_id + ':' + client_secret
            ).toString('base64'))
        },
        json: true
    }
    request.post(authOptions, (error, response, body) => {
        var access_token = body.access_token;
        let uri = 'http://localhost:3000';
        res.redirect(uri + '?access_token' + access_token)
    })
})

app.get('/user-data/:user_token', (req, res) => {
    spotifyAPI.getUserData(req.params.user_token)
        .then(data => res.send(data))
        .catch(err => res.send([]));
})

app.get('/user-playlists/:user_token', (req, res) => {
    spotifyAPI.getUserPlaylists(req.params.user_token)
        .then(data => res.send(data))
        .catch(err => res.send([]));
})

app.listen(3001, () => {
    console.log("Port 3001 is open");
});
