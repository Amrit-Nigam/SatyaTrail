import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Link as LinkIcon, FileText } from 'lucide-react'
import NBButton from './NBButton'
import { cn } from '../lib/utils'
import { verificationService } from '../lib/services/verificationService'

const schema = z.object({
  inputType: z.enum(['text', 'url']),
  inputValue: z.string().min(10, 'Please enter at least 10 characters')
})

/**
 * Form at bottom of /verify page
 */
export default function ClaimInputForm({ defaultText = '', defaultUrl = '', onSubmit }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      inputType: defaultText ? 'text' : 'text',
      inputValue: defaultText || defaultUrl || ''
    }
  })

  const inputType = watch('inputType')

  const handleFormSubmit = (data) => {
    onSubmit?.(data)
  }

  const handleExampleSelect = (e) => {
    const demoId = e.target.value
    if (!demoId) return

    const demoClaim = verificationService.demoClaims.find(d => d.id === demoId)
    if (demoClaim) {
      setValue('inputValue', demoClaim.text)
      setValue('inputType', 'text')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="border-t-2 border-nb-ink bg-nb-card p-4"
    >
      {/* Input Type Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setValue('inputType', 'text')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-nb border-2 border-nb-ink text-sm font-medium transition-colors',
            inputType === 'text'
              ? 'bg-nb-ink text-white'
              : 'bg-transparent hover:bg-nb-ink/5'
          )}
        >
          <FileText className="w-4 h-4" />
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setValue('inputType', 'url')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-nb border-2 border-nb-ink text-sm font-medium transition-colors',
            inputType === 'url'
              ? 'bg-nb-ink text-white'
              : 'bg-transparent hover:bg-nb-ink/5'
          )}
        >
          <LinkIcon className="w-4 h-4" />
          Enter URL
        </button>

        {/* Example Dropdown */}
        <select
          onChange={handleExampleSelect}
          className="ml-auto px-3 py-1.5 border-2 border-nb-ink rounded-nb bg-white text-sm font-medium cursor-pointer focus:outline-none focus:ring-4 focus:ring-nb-accent/30"
          defaultValue=""
          data-testid="verify-example-claim"
        >
          <option value="">Use example claim...</option>
          {verificationService.demoClaims.map((demo) => (
            <option key={demo.id} value={demo.id}>
              {demo.text.slice(0, 50)}...
            </option>
          ))}
        </select>
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        {inputType === 'text' ? (
          <textarea
            {...register('inputValue')}
            placeholder="Paste the news article text or claim you want to verify..."
            className={cn(
              'flex-1 min-h-[80px] max-h-[200px] p-3 border-2 border-nb-ink rounded-nb bg-white resize-y focus:outline-none focus:ring-4 focus:ring-nb-accent/30',
              errors.inputValue && 'border-nb-error ring-2 ring-nb-error/30'
            )}
            data-testid="chat-input"
          />
        ) : (
          <input
            type="url"
            {...register('inputValue')}
            placeholder="Enter article URL..."
            className={cn(
              'flex-1 p-3 border-2 border-nb-ink rounded-nb bg-white focus:outline-none focus:ring-4 focus:ring-nb-accent/30',
              errors.inputValue && 'border-nb-error ring-2 ring-nb-error/30'
            )}
            data-testid="chat-input"
          />
        )}

        <NBButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="self-end"
          data-testid="chat-send"
        >
          <Send className="w-5 h-5" />
          Check
        </NBButton>
      </div>

      {/* Error Message */}
      {errors.inputValue && (
        <p className="mt-2 text-sm text-nb-error font-medium">
          {errors.inputValue.message}
        </p>
      )}
    </form>
  )
}

