// DEMO MODE: makes NO real DNS changes. Returns simulated results only.
const demo = {
  name: 'demo',
  async listRecords(domain) { return { demo: true, domain, records: [] }; },
  async setRecord(domain, record) { return { demo: true, domain, record, applied: false, note: 'Demo mode: no DNS change was made.' }; },
};
export default demo;
