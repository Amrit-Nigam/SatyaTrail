import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Link as LinkIcon, FileText } from 'lucide-react'
import { cn } from '../lib/utils'
import { verificationService } from '../lib/services/verificationService'

const schema = z.object({
  inputType: z.enum(['text', 'url']),
  inputValue: z.string().min(10, 'Please enter at least 10 characters')
})

/**
 * Form at bottom of /verify page
 */
export default function ClaimInputForm({ defaultText = '', defaultUrl = '', onSubmit, disabled = false }) {
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
      className="border-t border-nb-ink/20 bg-white/60 p-4"
    >
      {/* Input Type Toggle */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setValue('inputType', 'text')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nb-ink/30 text-sm font-bold transition-colors',
            inputType === 'text'
              ? 'bg-black text-white border-black'
              : 'bg-white/60 text-black hover:bg-black hover:text-white'
          )}
        >
          <FileText className="w-4 h-4" />
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setValue('inputType', 'url')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nb-ink/30 text-sm font-bold transition-colors',
            inputType === 'url'
              ? 'bg-black text-white border-black'
              : 'bg-white/60 text-black hover:bg-black hover:text-white'
          )}
        >
          <LinkIcon className="w-4 h-4" />
          Enter URL
        </button>

        {/* Example Dropdown */}
        <select
          onChange={handleExampleSelect}
          className="ml-auto px-3 py-1.5 border border-nb-ink/30 rounded-lg bg-white text-sm font-bold cursor-pointer focus:outline-none focus:border-black text-black"
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
              'flex-1 min-h-[80px] max-h-[200px] p-3 border border-nb-ink/30 rounded-lg bg-white resize-y focus:outline-none focus:border-black text-black placeholder:text-nb-ink/50',
              errors.inputValue && 'border-red-500'
            )}
            data-testid="chat-input"
          />
        ) : (
          <input
            type="url"
            {...register('inputValue')}
            placeholder="Enter article URL..."
            className={cn(
              'flex-1 p-3 border border-nb-ink/30 rounded-lg bg-white focus:outline-none focus:border-black text-black placeholder:text-nb-ink/50',
              errors.inputValue && 'border-red-500'
            )}
            data-testid="chat-input"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting || disabled}
          className={cn(
            "self-end px-6 py-3 border border-nb-ink/30 rounded-lg uppercase tracking-wide text-sm font-bold transition-colors inline-flex items-center gap-2",
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-black/90'
          )}
          data-testid="chat-send"
        >
          <Send className="w-5 h-5" />
          {disabled ? 'Verifying...' : 'Check'}
        </button>
      </div>

      {/* Error Message */}
      {errors.inputValue && (
        <p className="mt-2 text-sm text-red-600 font-semibold">
          {errors.inputValue.message}
        </p>
      )}
    </form>
  )
}

