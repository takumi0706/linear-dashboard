interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function linearGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch("/api/linear", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Try token refresh
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (refreshResponse.ok) {
        // Retry original request
        const retryResponse = await fetch("/api/linear", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!retryResponse.ok) {
          throw new Error(`Linear API error: ${retryResponse.status}`);
        }

        const retryData = (await retryResponse.json()) as GraphQLResponse<T>;
        if (retryData.errors?.length) {
          throw new Error(retryData.errors[0].message);
        }
        return retryData.data;
      }

      // Refresh failed, redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    throw new Error(`Linear API error: ${response.status}`);
  }

  const data = (await response.json()) as GraphQLResponse<T>;

  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }

  return data.data;
}
