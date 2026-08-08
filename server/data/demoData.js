// Synthetic "organization" data. In a real deployment this would come from
// HRIS/IAM/vendor-management integrations (see Future Scope). For the demo
// it's static so judges see live findings the moment a policy is uploaded.

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const employees = [
  { id: 'EMP001', name: 'Ananya Rao', department: 'Engineering', trainingCompleted: true, trainingDate: daysAgo(40), passwordLastChanged: daysAgo(20), policyAcknowledged: true, accessReviewCompleted: true },
  { id: 'EMP002', name: 'Rahul Mehta', department: 'Finance', trainingCompleted: false, trainingDate: null, passwordLastChanged: daysAgo(210), policyAcknowledged: true, accessReviewCompleted: false },
  { id: 'EMP003', name: 'Sara Khan', department: 'HR', trainingCompleted: true, trainingDate: daysAgo(370), passwordLastChanged: daysAgo(45), policyAcknowledged: false, accessReviewCompleted: true },
  { id: 'EMP004', name: 'Vikram Singh', department: 'IT', trainingCompleted: true, trainingDate: daysAgo(10), passwordLastChanged: daysAgo(5), policyAcknowledged: true, accessReviewCompleted: true },
  { id: 'EMP005', name: 'Priya Nair', department: 'Operations', trainingCompleted: false, trainingDate: null, passwordLastChanged: daysAgo(300), policyAcknowledged: false, accessReviewCompleted: false },
  { id: 'EMP006', name: 'Karan Verma', department: 'Legal', trainingCompleted: true, trainingDate: daysAgo(60), passwordLastChanged: daysAgo(90), policyAcknowledged: true, accessReviewCompleted: true },
  { id: 'EMP007', name: 'Divya Iyer', department: 'Security', trainingCompleted: true, trainingDate: daysAgo(15), passwordLastChanged: daysAgo(12), policyAcknowledged: true, accessReviewCompleted: true },
  { id: 'EMP008', name: 'Arjun Kapoor', department: 'Finance', trainingCompleted: true, trainingDate: daysAgo(400), passwordLastChanged: daysAgo(180), policyAcknowledged: true, accessReviewCompleted: false },
];

const vendors = [
  { id: 'VEN001', name: 'CloudNova Hosting', certExpiry: daysFromNow(-10), documentsUploaded: true, contractStatus: 'active' },
  { id: 'VEN002', name: 'SecurePay Gateway', certExpiry: daysFromNow(120), documentsUploaded: true, contractStatus: 'active' },
  { id: 'VEN003', name: 'DataWarehouse Partners', certExpiry: daysFromNow(-3), documentsUploaded: false, contractStatus: 'active' },
  { id: 'VEN004', name: 'HR Payroll Systems', certExpiry: daysFromNow(200), documentsUploaded: true, contractStatus: 'renewal_pending' },
];

const departments = ['Engineering', 'Finance', 'HR', 'IT', 'Operations', 'Legal', 'Security'];

const systems = [
  { id: 'SYS001', name: 'Core Banking API', patchStatus: 'current', accessLogsReviewed: true },
  { id: 'SYS002', name: 'Employee HR Portal', patchStatus: 'overdue', accessLogsReviewed: false },
  { id: 'SYS003', name: 'Vendor Payment System', patchStatus: 'current', accessLogsReviewed: true },
];

module.exports = { employees, vendors, departments, systems };
