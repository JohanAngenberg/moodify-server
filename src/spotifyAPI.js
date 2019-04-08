import request from 'request-promise';
import { getBuffer } from './utils';

const BASE_URL = 'https://api.spotify.com/v1';

export default class SpotifyAPI {
    /**
     * 
     * @param {String} client_id 
     * @param {String} client_secret 
     */
    constructor(client_id, client_secret) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.getAccessToken();
    }
    getAccessToken() {
        const options = {
            method: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                Authorization: `Basic ${getBuffer(`${this.client_id}:${this.client_secret}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: { grant_type: 'client_credentials' },
            body: {
                scope: "playlist-modify-public"
            }
        };
        request(options)
            .catch(err => {
                console.log(err);
            })
            .then(data => {
                const { access_token } = JSON.parse(data);
                this.access_token = access_token;
            });
        console.log("New access token generated!");
    }


    /**
     * 
     * @param {String} searchQueries 
     * @param {String} endPoint
     * @returns {Promise}
     */


    apiRequest(searchQueries, endPoint) {
        const options = {
            method: 'GET',
            url: `${BASE_URL}/${endPoint}`,
            headers: {
                Authorization: `Bearer ${this.access_token}`
            },
        }

        if (searchQueries) {
            options.url = `${options.url}${searchQueries}`;
        }
        return new Promise((resolve, reject) => {
            request(options)
                .then(data => resolve(JSON.parse(data)))
                .catch(err => reject(err));
        });
    }

    /**
     * 
     * @param {String} query
     * @returns {Promise}
     */
    searchRequest(query) {
        return this.apiRequest(query, '?q=search');
    }

    /**
     * 
     * @param {String} query
     * @returns {Promise}
     */

    artistRequest(query = '') {
        return this.apiRequest(query, '?q=artists');
    }

    /**
     * 
     * @param {String} playlistId 
     * @returns {Promise}
     */

    playlistRequest(playlistId) {
        return this.apiRequest(false, `playlists/${playlistId}`);
    }

    /**
     * 
     * @param {Promise} playlistId 
     */

    audioFeaturesOfPlaylist(playlistId) {
        return new Promise((resolve, reject) => {
            this.playlistRequest(playlistId)
                .then(playListObject => {
                    const tracksArray = playListObject.tracks.items.map(item => {
                        return {
                            id: item.track.id,
                            artist: item.track.artists.map(artist => artist.name).join(),
                            songName: item.track.name,
                            image: item.track.album.images[1].url
                        };
                    });
                    const listOfIds = tracksArray.map(track => track.id).join();
                    this.audioFeature(listOfIds)
                        .then(audioFeatures => {
                            const addedNames = audioFeatures.audio_features.map((audio, index) => {
                                return {
                                    ...audio,
                                    ...tracksArray[index],
                                }
                            });
                            resolve(addedNames);
                        })
                        .catch(err => reject(err));
                }).catch(err => reject(err));
        });
    }

    /**
     * 
     * @param {String} trackIds
     * @returns {Promise}
     */
    audioFeature(trackIds) {
        return this.apiRequest(`?ids=${trackIds}`, 'audio-features/');
    }

    newPlaylist(userId, playlistName, userToken) {
        console.log(userId);

        const options = {
            method: 'POST',
            url: `${BASE_URL}/users/${userId}/playlists`,
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            },
            dataType: 'json',
            body: JSON.stringify({
                'name': playlistName,
                'public': true
            }),
        }

        request.post(options, (err, resp, body) => {

            console.log(body)
        });


    }

    addTracks(playlistId, trackList) {
        const options = {
            method: 'POST',
            url: `${BASE_URL}/playlists/${playlistId}/tracks`,
            headers: {
                Authorization: `Bearer ${this.access_token}`,
                'Content-Type': 'application/json'
            },
            body: {
                uris: trackList.map((track) => (
                    `spotify:track:${track}`
                ))
            }
        }
        return new Promise((resolve, reject) => {
            request(options)
                .then(data => resolve(JSON.parse(data)))
                .catch(err => reject(err));
        });
    }

}