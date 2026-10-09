// TODO: settable in .env
// Currently hardcoded for MVP
const BASE = "https://usosapi.polsl.pl/services";

export default async function usosFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${response.status}: ${await response.text()}`
    );
  }

  return response.json() as Promise<T>;
}