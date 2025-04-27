<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main>
  {@render children()}
</main>

<footer>
  <p>&copy; {new Date().getFullYear()} WebPing. All rights reserved.</p>
</footer>

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    width: 100%;
    max-width: 100%;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  footer {
    width: 100%;
    padding: 1rem 0;
    margin-top: 2rem;
    text-align: center;
    color: #666;
    font-size: 0.9em;
    border-top: 1px solid #eee;
  }
</style>
