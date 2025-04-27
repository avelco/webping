<script lang="ts">
  import { onMount } from 'svelte';

  type Domain = {
    name: string;
    status: 'up' | 'down';
    responseTime: number;
    loading: boolean;
    reason: string | null;
  };

  let domains: Domain[] = [
    { name: 'conyko.com', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'app.conyko.com', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'cobranti.com', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'app.cobranti.com', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'api.conyko.com/docs/api', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'crm.cobranti.com', status: 'down', responseTime: 0, loading: false, reason: null },
    { name: 'api.crm.cobranti.com', status: 'down', responseTime: 0, loading: false, reason: null },
  ];
  let newDomain = '';

  async function checkDomain(name: string) {
    try {
      const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(name)}`);
      if (res.ok) {
        const { status, responseTime, reason } = await res.json();
        return { status, responseTime, reason };
      } else {
        const errorData = await res.json();
        return { status: 'down', responseTime: 0, reason: errorData.message || `API Error (${res.status})` };
      }
    } catch (error: any) {
      console.error('Error calling check-domain API:', error);
      return { status: 'down', responseTime: 0, reason: `Failed to check: ${error.message}` };
    }
  }

  onMount(() => {
    initialCheck();
  });

  async function initialCheck() {
    domains = domains.map((d) => ({ ...d, loading: true, reason: 'Checking...' }));
    domains = await Promise.all(
      domains.map(async (d) => {
        const r = await checkDomain(d.name);
        return { ...d, status: r.status, responseTime: r.responseTime, reason: r.reason, loading: false };
      })
    );
  }

  async function addDomain() {
    if (newDomain.trim()) {
      const name = newDomain.trim();
      domains = [...domains, { name, status: 'up', responseTime: 0, loading: true, reason: 'Adding...' }];
      newDomain = '';
      const r = await checkDomain(name);
      domains = domains.map((d) =>
        d.name === name
          ? { ...d, status: r.status, responseTime: r.responseTime, reason: r.reason, loading: false }
          : d
      );
    }
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6 text-center">Domain Monitor</h1>

  <div class="flex flex-col sm:flex-row items-center mb-6 gap-4">
    <input
      type="text"
      placeholder="Add a domain to monitor"
      bind:value={newDomain}
      class="w-full sm:flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      on:click={addDomain}
      class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded transition"
    >
      Add Domain
    </button>
    <button
      on:click={initialCheck}
      class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded transition"
    >
      Refresh All
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {#each domains as domain}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold mb-2 break-words">{domain.name}</h2>
          {#if domain.loading}
            <div class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span class="text-sm text-gray-500" title={domain.reason ?? 'Loading...'}>Checking…</span>
            </div>
          {:else}
            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors {domain.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}" title={domain.reason ?? domain.status}>
              {domain.status === 'up' ? 'Up' : 'Down'}
            </span>
          {/if}
        </div>
        <div class="mt-4 text-gray-700 dark:text-gray-300">
          <p class="text-sm">Response Time:</p>
          {#if domain.loading}
            <p class="text-lg font-medium">-- ms</p>
          {:else}
            <p class="text-lg font-medium">{domain.responseTime} ms</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>