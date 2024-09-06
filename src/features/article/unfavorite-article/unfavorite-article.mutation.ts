import {
  DefaultError,
  UseMutationOptions,
  useMutation,
} from '@tanstack/react-query'
import { FavoriteService } from '~shared/api/favorite'
import { queryClient } from '~shared/lib/react-query'
import { ArticleQueries, articleTypes } from '~entities/article'

export function useUnfavoriteArticleMutation(
  options?: Pick<
    UseMutationOptions<
      Awaited<ReturnType<typeof FavoriteService.unfavoriteArticleMutation>>,
      DefaultError,
      articleTypes.Article,
      unknown
    >,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  >,
) {
  const {
    mutationKey = [],
    onMutate,
    onSuccess,
    onError,
    onSettled,
  } = options || {}

  return useMutation({
    mutationKey: ['article', 'unfavorite', ...mutationKey],

    mutationFn: ({ slug }: articleTypes.Article) =>
      FavoriteService.unfavoriteArticleMutation(slug),

    onMutate: async (updatedArticle) => {
      await queryClient.cancelQueries({ queryKey: ArticleQueries.keys.root })

      const previousArticle = queryClient.getQueryData(
        ArticleQueries.articleQuery(updatedArticle.slug).queryKey,
      )

      queryClient.setQueryData(
        ArticleQueries.articleQuery(updatedArticle.slug).queryKey,
        updatedArticle,
      )

      await onMutate?.(updatedArticle)

      return { previousArticle }
    },

    onSuccess,

    onError: async (error, updatedArticle, context) => {
      const { previousArticle } = context || {}

      queryClient.setQueryData(
        ArticleQueries.articleQuery(updatedArticle.slug).queryKey,
        previousArticle,
      )

      await onError?.(error, updatedArticle, context)
    },

    onSettled: async (data, error, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ArticleQueries.keys.root }),
        onSettled?.(data, error, variables, context),
      ])
    },
  })
}
