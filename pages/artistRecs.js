import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import {makePrompt} from '/lib/makePrompt.js'
import { makePromptArtistRecs } from '@/lib/makePrompt';
/* TODO:
-fetch users top artists
-ask open ai for 5 artist recs based on this
-search for spotify artist ID with spotify search api
-display artist and image of artist*/
const artistRecs = () => {
  const [artists, setArtists] = useState([]);
  const [recs, setRecs] = useState('');
  let generatingFuncCalled = useRef(false);
  const [artistRecs, setArtistRecs] = useState([]);
 
  const [artistPic, setArtistPic] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const session = await getSession();
      const accessToken = session?.accessToken;

      if (!accessToken) {
        // Handle case when access token is not available
        return;
      }

      try {
        const artistsResponse = await axios.get(
          'https://api.spotify.com/v1/me/top/artists',
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        const artistsData = artistsResponse.data.items;


        setArtists(artistsData);
      } catch (error) {
        console.error('Error retrieving favorite artists and genres:', error);
        // Handle error appropriately
      }
    };

    if (artists.length === 0) {
      fetchData();
    }
  }, []); 



  useEffect(() => {
        
    const generateRecs = async () => {
      console.log('generatingRecs...');
      try {
        const prompt = makePromptArtistRecs(
          artists.map((artist) => artist.name)
        );
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        setRecs(data.result);
        // Split the string based on the delimiter "."
        const artistItems = data.result.split(".");

      // Initialize an array to store the artists
        const artistRecsArray = data.result.split(/\d+\./).filter(item => item.trim() !== '').map(item => item.replace(/\n/g, '').trim());
        setArtistRecs(artistRecsArray)
        console.log(artistRecs);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Handle error appropriately
      }
    };

    if (artists.length > 0  &&recs === '') {
        if (!generatingFuncCalled.current) { // access the current value of the ref using .current
            generatingFuncCalled.current = true;
            generateRecs();
        }
    }
  }, [artists]);



  useEffect(() => {
    const getArtistImages = async () => {
      console.log('gettingArtistsImages...');
      const session = await getSession();
      const artistPicsArray = [];

      for (const artistName of artistRecs) {
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          params: {
            q: artistName,
            type: 'artist',
          },
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
    });

        const { artists } = searchResponse.data;

        if (artists.items.length > 0 && artists.items[0].images.length > 0) {
          const artistPicURL = artists.items[0].images[0].url;
          artistPicsArray.push(artistPicURL);
        }
      }


      
      setArtistPic(artistPicsArray);


    }

    if (!artistRecs.length == 0){
      console.log('artist recs here')
      console.log(artistRecs)
      
      getArtistImages();

    }
  }, [artistRecs]);


    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 text-black ">
      <Head>
        <title>Recommendations</title>
      </Head>
  
      <main className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-4xl font-bold text-black text-center">
          {recs ? (
            <span></span>
          ) : (
            <span>Getting artist recommendations...</span>
          )}
        </div>
       
        {artistPic.length > 0 && artistPic.length === artistRecs.length && (
  <div className="flex flex-col items-center justify-center text-black ">
    <h2 className="text-2xl font-bold text-center mb-4">
      You should check out these artists!
    </h2>
    <div className="grid grid-cols-2 gap-4">
      {artistPic.map((url, index) => (
        <div key={index} className="flex flex-col items-center">
          <img
            src={url}
            alt={`Artist ${index + 1}`}
            className="w-48 h-48 rounded-full mb-2"
          />
          <p className="text-lg text-center">{artistRecs[index]}</p>
        </div>
      ))}
    </div>
  </div>
)}
      </main>


        <footer className="fixed bottom-0 left-0 right-0 bg-gray-200 py-2">
                  <div className="flex justify-center">
                      <Link legacyBehavior href="/">
                      <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                          Return to Main Menu
                      </a>
                      </Link>
                  </div>
          </footer>
      </div>
    );
  };
  export default artistRecs;