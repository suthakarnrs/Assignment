// Simplified in-memory queue service for development without Redis
class SimpleQueue {
  constructor() {
    this.jobs = []
    this.processing = false
  }

  async add(jobType, data) {
    const job = {
      id: Date.now(),
      type: jobType,
      data,
      status: 'waiting',
      createdAt: new Date()
    }
    
    this.jobs.push(job)
    this.processNext()
    
    return job
  }

  async processNext() {
    if (this.processing) return
    
    const nextJob = this.jobs.find(job => job.status === 'waiting')
    if (!nextJob) return
    
    this.processing = true
    nextJob.status = 'processing'
    
    try {
      if (nextJob.type === 'process-file') {
        const fileProcessor = require('./fileProcessor')
        await fileProcessor.processFile(nextJob.data.jobId)
      } else if (nextJob.type === 'reconcile-records') {
        const reconciliationService = require('./reconciliationService')
        await reconciliationService.reconcileUploadJob(
          nextJob.data.uploadJobId, 
          nextJob.data.userId
        )
      }
      
      nextJob.status = 'completed'
      console.log(`Job ${nextJob.id} completed successfully`)
    } catch (error) {
      nextJob.status = 'failed'
      nextJob.error = error.message
      console.error(`Job ${nextJob.id} failed:`, error)
    }
    
    this.processing = false
    
    // Process next job
    setTimeout(() => this.processNext(), 1000)
  }

  getStats() {
    return {
      waiting: this.jobs.filter(j => j.status === 'waiting').length,
      active: this.jobs.filter(j => j.status === 'processing').length,
      completed: this.jobs.filter(j => j.status === 'completed').length,
      failed: this.jobs.filter(j => j.status === 'failed').length
    }
  }
}

const simpleQueue = new SimpleQueue()

// Export compatible interface
module.exports = {
  addFileProcessingJob: (data) => simpleQueue.add('process-file', data),
  addReconciliationJob: (data) => simpleQueue.add('reconcile-records', data),
  getQueueStats: () => Promise.resolve(simpleQueue.getStats())
}