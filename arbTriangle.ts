import axios from 'axios';
import { writeFileSync } from 'fs'; // Import the writeFileSync function

interface Asset {
  asset_code: string;
  asset_issuer?: string;
}

interface Offer {
  selling: Asset;
  buying: Asset;
}

export const fetchOffers = async (url: string, params: any) => {
  try {
    const response = await axios.get(url, { ...params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const processOffers = (jsonData: any) => {
  const offers: Offer[] = jsonData._embedded.records;

  const assetPairs = offers
    .filter((offer: Offer) =>
      offer.selling.asset_issuer !== undefined &&
      offer.buying.asset_issuer !== undefined
    )
    .map((offer: Offer) => ({
      selling: {
        asset_code: offer.selling.asset_code,
        asset_issuer: offer.selling.asset_issuer,
      },
      buying: {
        asset_code: offer.buying.asset_code,
        asset_issuer: offer.buying.asset_issuer,
      },
    }));

  const jsonContent = JSON.stringify(assetPairs, null, 2); // Convert assetPairs to JSON format

  // Write the JSON content to a file named 'assetPairs.json'
  writeFileSync('assetPairs.json', jsonContent);

  console.log('Processed asset pairs saved to assetPairs.json');
};

const fetchAndProcessOffers = async (url: string, limit: number | undefined, cursor: string | null = null) => {
  const params: any = {
    headers: {
      'Accept': 'application/json',
    },
    params: {
      limit,
      cursor,
    },
  };

  while (true) {
    const jsonData = await fetchOffers(url, params);
    processOffers(jsonData);

    if (jsonData._links.next) {
      cursor = new URL(jsonData._links.next.href).searchParams.get('cursor');
      params.params.cursor = cursor;
    } else {
      break;
    }
  }
};

const baseUrl = 'https://horizon.stellar.org/offers';
const limitPerPage = 100;

fetchAndProcessOffers(baseUrl, limitPerPage)
  .catch((error: any) => {
    console.log(error);
  });
