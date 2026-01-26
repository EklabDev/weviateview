import { getSettings } from './settings';

type SortConfig = {
  property: string;
  order: 'asc' | 'desc';
} | null;

export interface CollectionInfo {
  name: string;
  description?: string;
  count: number;
  properties: {
    name: string;
    description?: string;
    dataType?: string[];
  }[];
}

export type CollectionData = Record<string, unknown>;

let currentUrl: string = '';
let currentApiKey: string = '';

export async function initializeWeaviate() {
  const settings = await getSettings();
  console.log('Initializing Weaviate with settings:', {
    weaviateUrl: settings.weaviateUrl ? `${settings.weaviateUrl.substring(0, 20)}...` : '(empty)',
    hasApiKey: !!settings.apiKey,
  });
  currentUrl = settings.weaviateUrl;
  currentApiKey = settings.apiKey;
  
  if (!currentUrl || currentUrl.trim() === '') {
    console.warn('Weaviate URL is empty after initialization');
  }
}

export function getWeaviateUrl(): string {
  return currentUrl || 'URL not configured';
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (currentApiKey) {
    headers['Authorization'] = `Bearer ${currentApiKey}`;
  }
  
  return headers;
}

export async function executeQuery(queryStr: string): Promise<any> {
  try {
    // Initialize first to load settings
    await initializeWeaviate();
    
    // Check URL after initialization
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }

    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: queryStr }),
    });

    if (!response.ok) {
      console.error(`GraphQL query failed with status: ${response.status} ${response.statusText}`);
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

export async function getCollections(): Promise<CollectionInfo[]> {
  try {
    // Initialize first to load settings
    await initializeWeaviate();
    
    // Check URL after initialization
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }

    console.log(`Connected to Weaviate at: ${currentUrl}`);
    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/schema`, {
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to fetch schema. Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    const schema: { classes?: WeaviateClass[] } = await response.json();
    const classes = schema.classes ?? [];

    const result: CollectionInfo[] = [];
    for (const weavClass of classes) {
      console.log(`\n*** Collection: ${weavClass.class}`);
      console.log(`\tFetching object count`);
      const count = await getObjectCount(weavClass.class);
      console.log(`\tFetching properties`);
      result.push({
        name: weavClass.class,
        description: weavClass.description,
        count,
        properties: weavClass.properties?.map((p) => ({
          name: p.name,
          dataType: p.dataType,
          description: p.description,
        })) ?? [],
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

type WeaviateClass = {
  class: string;
  description?: string;
  properties?: {
    name: string;
    dataType: string[];
    description?: string;
  }[];
};

async function executeAggregateQuery(queryStr: string, className: string): Promise<any> {
  try {
    // Ensure initialized (may have been called already, but safe to call again)
    await initializeWeaviate();
    
    // Check URL after initialization
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }

    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: queryStr }),
    });

    if (!response.ok) {
      console.error(`Query failed for collection "${className}". Status: ${response.status} ${response.statusText}`);
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Query error for collection "${className}":`, error);
    throw error;
  }
}

async function getObjectCount(className: string): Promise<number> {
  const aggregateQuery = `
    {
      Aggregate {
        ${className} {
          meta {
            count
          }
        }
      }
    }
  `;

  let aggregateResponse: any = null;
  try {
    aggregateResponse = await executeAggregateQuery(aggregateQuery, className);
  } catch (error) {
    console.error(`Error fetching count for collection "${className}":`, error);
    return 0;
  }

  const aggregateData = aggregateResponse?.data.Aggregate[className] ?? [];
  return aggregateData[0]?.meta?.count ?? 0;
}

export async function getCollectionData(
  className: string,
  properties: { name: string; dataType: string | string[] }[],
  sort?: SortConfig,
  limit?: number,
  offset?: number,
): Promise<CollectionData[]> {
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    const sortDirective = sort
      ? `sort: {
          path: ["${sort.property}"],
          order: ${sort.order.toLowerCase()}
        }`
      : '';

    const paginationDirective = `limit: ${limit}, offset: ${offset}`;

    const directives = [sortDirective, paginationDirective].filter(Boolean).join(', ');

    const query = `{
      Get {
        ${className}${directives ? `(${directives})` : ''} {
          _additional {
            id
          }
          ${properties.map((p) => p.name).join('\n')}
        }
      }
    }`;

    console.log('Executing GraphQL query:', JSON.stringify({ query }, null, 2));
    console.log(`\n*** Collection: ${className}`);
    console.log(`\tFetching data`);
    const response = await executeQuery(query);

    if (!response?.data?.Get) {
      throw new Error('Invalid response structure from Weaviate');
    }

    return response.data.Get[className] || [];
  } catch (error) {
    console.error(`Error fetching data for collection "${className}":`, error);
    throw error;
  }
}

export async function deleteObjects(className: string, objectIds: string[]): Promise<void> {
  console.log(`\n*** Collection: ${className}`);
  console.log(`\tDeleting ${objectIds.length} objects`);

  await initializeWeaviate();
  if (!currentUrl || currentUrl.trim() === '') {
    throw new Error('Weaviate URL is not configured. Please set it in Settings.');
  }
  const headers = await getHeaders();

  for (const id of objectIds) {
    try {
      const response = await fetch(`${currentUrl}/v1/objects/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        console.error(`Failed to delete object "${id}". Status: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to delete object: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting object "${id}":`, error);
      throw error;
    }
  }
}

export async function deleteCollection(className: string): Promise<void> {
  console.log(`\n*** Collection: ${className}`);
  console.log(`\tDeleting collection`);
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/schema/${className}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to delete collection "${className}". Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to delete collection: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting collection "${className}":`, error);
    throw error;
  }
}

export interface CreateCollectionSchema {
  class: string;
  description?: string;
  properties: Array<{
    name: string;
    dataType: string[];
    description?: string;
  }>;
}

export async function createCollection(schema: CreateCollectionSchema): Promise<void> {
  console.log(`\n*** Creating collection: ${schema.class}`);
  
  try {
    // Initialize first to load settings
    await initializeWeaviate();
    
    // Check URL after initialization
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    
    console.log('Current Weaviate URL:', currentUrl);
    console.log('Has API Key:', !!currentApiKey);
    
    // Ensure URL doesn't end with slash
    const baseUrl = currentUrl.replace(/\/$/, '');
    
    // Ensure collection name starts with uppercase (Weaviate requirement)
    const className = schema.class.charAt(0).toUpperCase() + schema.class.slice(1);
    
    // Map dataType to Weaviate format
    // Weaviate REST API uses lowercase: text, int, number, boolean, date, text[], int[], etc.
    const mappedProperties = schema.properties.map((prop) => {
      const dataType = prop.dataType[0] || 'string';
      let weaviateDataType: string;
      
      if (dataType.includes('[]')) {
        // Array type - format: "text[]", "int[]", etc.
        const baseType = dataType.replace('[]', '').toLowerCase();
        switch (baseType) {
          case 'string':
          case 'text':
            weaviateDataType = 'text[]';
            break;
          case 'int':
            weaviateDataType = 'int[]';
            break;
          case 'number':
            weaviateDataType = 'number[]';
            break;
          case 'boolean':
            weaviateDataType = 'boolean[]';
            break;
          case 'date':
            weaviateDataType = 'date[]';
            break;
          default:
            weaviateDataType = 'text[]';
        }
      } else {
        // Single type - format: "text", "int", "number", etc.
        const lowerType = dataType.toLowerCase();
        switch (lowerType) {
          case 'string':
          case 'text':
            weaviateDataType = 'text';
            break;
          case 'int':
            weaviateDataType = 'int';
            break;
          case 'number':
            weaviateDataType = 'number';
            break;
          case 'boolean':
            weaviateDataType = 'boolean';
            break;
          case 'date':
            weaviateDataType = 'date';
            break;
          default:
            weaviateDataType = 'text';
        }
      }
      
      return {
        name: prop.name,
        dataType: [weaviateDataType],
        description: prop.description,
      };
    });

    const weaviateSchema = {
      class: className,
      description: schema.description,
      properties: mappedProperties,
    };

    console.log('Creating collection with schema:', JSON.stringify(weaviateSchema, null, 2));

    const headers = await getHeaders();
    const url = `${baseUrl}/v1/schema`;
    console.log('POST URL:', url);
    console.log('Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(weaviateSchema),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Unknown error';
      }
      
      console.error(`Failed to create collection "${schema.class}". Status: ${response.status} ${response.statusText}`);
      console.error('Response body:', errorText);
      
      // Try to parse error as JSON for better error messages
      let errorMessage = `Failed to create collection: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          if (Array.isArray(errorJson.error) && errorJson.error.length > 0) {
            errorMessage = errorJson.error[0].message || errorMessage;
          } else if (typeof errorJson.error === 'string') {
            errorMessage = errorJson.error;
          } else if (errorJson.error.message) {
            errorMessage = errorJson.error.message;
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        if (errorText && errorText.length < 500) {
          errorMessage = `${errorMessage}. ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json().catch(() => ({}));
    console.log('Collection created successfully:', result);
    console.log(`Successfully created collection: ${className}`);
  } catch (error) {
    console.error(`Error creating collection "${schema.class}":`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to create collection: ${String(error)}`);
  }
}

export async function createObject(className: string, object: Record<string, unknown>): Promise<string> {
  console.log(`\n*** Creating object in collection: ${className}`);
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/objects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        class: className,
        properties: object,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create object. Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to create object: ${response.statusText}. ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error(`Error creating object in collection "${className}":`, error);
    throw error;
  }
}

export async function getObjectById(className: string, objectId: string): Promise<CollectionData | null> {
  console.log(`\n*** Fetching object ${objectId} from collection: ${className}`);
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/objects/${objectId}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error(`Failed to fetch object. Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch object: ${response.statusText}`);
    }

    const result = await response.json();
    // Return just the properties for editing
    return result.properties || {};
  } catch (error) {
    console.error(`Error fetching object from collection "${className}":`, error);
    throw error;
  }
}

export async function updateObject(className: string, objectId: string, object: Record<string, unknown>): Promise<void> {
  console.log(`\n*** Updating object ${objectId} in collection: ${className}`);
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }
    const headers = await getHeaders();
    const response = await fetch(`${currentUrl}/v1/objects/${objectId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        class: className,
        properties: object,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update object. Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to update object: ${response.statusText}. ${errorText}`);
    }
  } catch (error) {
    console.error(`Error updating object in collection "${className}":`, error);
    throw error;
  }
}

export type SearchType = 'bm25' | 'vector' | 'hybrid';

export interface SearchOptions {
  query: string;
  collectionName: string;
  searchType?: SearchType;
  limit?: number;
  properties?: string[];
}

export async function searchCollections(options: SearchOptions): Promise<CollectionData[]> {
  try {
    await initializeWeaviate();
    if (!currentUrl || currentUrl.trim() === '') {
      throw new Error('Weaviate URL is not configured. Please set it in Settings.');
    }

    const { query, collectionName, searchType = 'bm25', limit = 10, properties } = options;
    const limitValue = limit || 10;

    let searchDirective = '';
    
    if (searchType === 'bm25') {
      // BM25 (keyword) search
      const propertiesList = properties && properties.length > 0 
        ? properties.map(p => `"${p}"`).join(', ')
        : '';
      searchDirective = `bm25: { query: "${query}"${propertiesList ? `, properties: [${propertiesList}]` : ''} }`;
    } else if (searchType === 'vector') {
      // Vector search (requires a vectorizer, using nearText as fallback)
      searchDirective = `nearText: { concepts: ["${query}"] }`;
    } else if (searchType === 'hybrid') {
      // Hybrid search (combines BM25 and vector)
      const propertiesList = properties && properties.length > 0 
        ? properties.map(p => `"${p}"`).join(', ')
        : '';
      searchDirective = `hybrid: { query: "${query}"${propertiesList ? `, properties: [${propertiesList}]` : ''} }`;
    }

    // Get all properties for the collection to include in the query
    const collections = await getCollections();
    const collection = collections.find(c => c.name === collectionName);
    const propertyNames = collection?.properties.map(p => p.name) || [];
    const propertiesToFetch = propertyNames.length > 0 ? propertyNames.join('\n') : '_additional { id }';

    const graphqlQuery = `{
      Get {
        ${collectionName}(
          ${searchDirective}
          limit: ${limitValue}
        ) {
          _additional {
            id
            score
          }
          ${propertiesToFetch}
        }
      }
    }`;

    console.log('Executing search query:', JSON.stringify({ query: graphqlQuery }, null, 2));
    
    const response = await executeQuery(graphqlQuery);

    if (!response?.data?.Get) {
      throw new Error('Invalid response structure from Weaviate');
    }

    return response.data.Get[collectionName] || [];
  } catch (error) {
    console.error(`Error searching collection "${options.collectionName}":`, error);
    throw error;
  }
}
