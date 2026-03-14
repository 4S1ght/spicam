<script lang="ts">

    interface Props {
        width?: string | number
        class?: string
        children: any
    }

    const props: Props = $props()

</script>

<div class="content" style="--max-width: {props.width};">
    <div class="content-column {props.class || ''}">
        {@render props.children()}
    </div>
</div>

<style>

    .content {
        width: 100%;
        display: flex;
        justify-content: center;

        margin-bottom: 4.5rem;
        @media screen and (max-width: 768px) {
            margin-bottom: 4rem;
        }

        .content-column {
            width: 90%;
            max-width: var(--max-width);
        }
    }


</style>