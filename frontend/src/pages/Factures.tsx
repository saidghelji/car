import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Receipt, FileText, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import CloseButton from '../components/CloseButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import EditButton from '../components/EditButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Customer } from './Customers';
import ArabicKeyboard from '../components/ArabicKeyboard'; // Import ArabicKeyboard

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

export interface Facture { // Export the interface as Facture
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string; // Add dueDate field
  client?: Customer; // Make client optional
  location: string;
  type: 'Professionel' | 'Particulier';
  montantHT: number; // Add Montant HT field
  tvaAmount: number;
  tvaPercentage: number;
  totalTTC: number;
  paymentType: 'espèce' | 'chèque' | 'carte bancaire' | 'virement';
  amountPaid: number;
  contract?: Contract; // Change to full Contract object
}

interface Contract {
  _id: string;
  contractNumber: string;
  client: string; // Assuming client is just an ID here for simplicity
  total: number; // Add total property
  vehicle?: {
    brand?: string;
    model?: string;
    licensePlate?: string;
    // Add other vehicle fields if needed
  };
  duration?: number;
  // Add other contract fields you might need to display or use
}

const Factures = () => {
  const [invoices, setInvoices] = useState<Facture[]>([]); // Use Facture
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all'); // New filter for invoice status
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Facture | null>(null); // Use Facture
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Facture | null>(null); // Use Facture
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const API_URL = 'http://localhost:5000'; // Base API URL for FileUploader
  const API_URL_INVOICES = `${API_URL}/api/factures`;
  const API_URL_CUSTOMERS = `${API_URL}/api/customers`;
  const API_URL_CONTRACTS = `${API_URL}/api/contracts`;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoicesResponse, customersResponse, contractsResponse] = await Promise.all([
        axios.get<Facture[]>(`${API_URL_INVOICES}?populate=client`), // Populate client
        axios.get<Customer[]>(API_URL_CUSTOMERS),
        axios.get<Contract[]>(API_URL_CONTRACTS),
      ]);
      setInvoices(invoicesResponse.data);
      setCustomers(customersResponse.data);
      setContracts(contractsResponse.data);
      return {
        invoices: invoicesResponse.data,
        customers: customersResponse.data,
        contracts: contractsResponse.data,
      };
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
      toast.error('Failed to load data.');
      return { invoices: [], customers: [], contracts: [] }; // Return empty arrays on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      `${invoice.client?.prenomFr || ''} ${invoice.client?.nomFr || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice.amountPaid >= invoice.totalTTC) ||
      (statusFilter === 'unpaid' && invoice.amountPaid < invoice.totalTTC);

    const invoiceDate = new Date(invoice.invoiceDate);
    const matchesStartDate = startDateFilter ? invoiceDate >= startDateFilter : true;
    const matchesEndDate = endDateFilter ? invoiceDate <= endDateFilter : true;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const getStatusColor = (invoice: Facture): string => {
    return invoice.amountPaid >= invoice.totalTTC ? 'text-green-500' : 'text-red-500';
  };

  const handleAddInvoice = async (data: Partial<Facture>) => {
    try {
      const payload = {
        client: data.client?._id,
        contract: data.contract?._id,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        totalTTC: data.totalTTC,
        invoiceNumber: data.invoiceNumber,
        location: data.location,
        type: data.type,
        montantHT: data.montantHT,
        tvaAmount: data.tvaAmount,
        tvaPercentage: data.tvaPercentage,
        paymentType: data.paymentType,
        amountPaid: data.amountPaid,
      };
      const response = await axios.post<Facture>(API_URL_INVOICES, payload);
      // After successful addition, re-fetch all data to ensure consistency and proper population
      await fetchData();
      setShowNewInvoiceModal(false);
      toast.success('Invoice added successfully.');
    } catch (err) {
      console.error('Error adding invoice:', err);
      toast.error('Failed to add invoice.');
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editedInvoice || !selectedInvoice) return;

    if (isOnlySpaces(editedInvoice.location)) {
      toast.error('Le champ "Lieu" ne peut pas être vide ou contenir uniquement des espaces.');
      return;
    }

    try {
      const payload = {
        client: editedInvoice.client?._id,
        contract: editedInvoice.contract?._id,
        invoiceDate: editedInvoice.invoiceDate,
        dueDate: editedInvoice.dueDate,
        totalTTC: editedInvoice.totalTTC,
        invoiceNumber: editedInvoice.invoiceNumber,
        location: editedInvoice.location,
        type: editedInvoice.type,
        montantHT: editedInvoice.montantHT,
        tvaAmount: editedInvoice.tvaAmount,
        tvaPercentage: editedInvoice.tvaPercentage,
        paymentType: editedInvoice.paymentType,
        amountPaid: editedInvoice.amountPaid,
      };
      const response = await axios.put<Facture>(`${API_URL_INVOICES}/${selectedInvoice._id}`, payload);
      // After successful update, re-fetch all data to ensure consistency
      await fetchData();
      // Find the updated invoice from the newly fetched invoices to ensure it's fully populated
      const updatedInvoiceFromFetch = invoices.find(inv => inv._id === response.data._id);
      if (updatedInvoiceFromFetch) {
        setSelectedInvoice(updatedInvoiceFromFetch);
      } else {
        // Fallback if for some reason the updated invoice isn't immediately found (shouldn't happen with await fetchData)
        setSelectedInvoice(response.data);
      }
      setEditMode(false);
      setEditedInvoice(null);
      toast.success('Invoice updated successfully.');
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await axios.delete(`${API_URL_INVOICES}/${invoiceId}`);
        setInvoices(invoices.filter(inv => inv._id !== invoiceId));
        setSelectedInvoice(null);
        setEditMode(false);
        setEditedInvoice(null);
        toast.success('Invoice deleted successfully.');
      } catch (err) {
        console.error('Error deleting invoice:', err);
        toast.error('Failed to delete invoice.');
      }
    }
  };

  const handleEditClick = () => {
    if (selectedInvoice) {
      setEditedInvoice({ ...selectedInvoice });
      setEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedInvoice(null);
    setValidationErrors({}); // Clear validation errors on cancel
  };

  const handleInputChange = (field: keyof Facture, value: any) => {
    if (editedInvoice) {
      setEditedInvoice(prev => {
        if (!prev) return null;
        let updatedInvoice = { ...prev, [field]: value };

        if (field === 'location') {
          if (isOnlySpaces(value)) {
            setValidationErrors(prevErrors => ({ ...prevErrors, [field]: 'Le champ "Lieu" ne peut pas contenir uniquement des espaces.' }));
          } else {
            setValidationErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors[field];
              return newErrors;
            });
          }
        }

        // Recalculate amounts if relevant fields change
        if (field === 'montantHT' || field === 'tvaPercentage' || field === 'tvaAmount') {
          const currentMontantHT = updatedInvoice.montantHT || 0;
          const currentTvaPercentage = updatedInvoice.tvaPercentage || 0;
          const currentTvaAmount = updatedInvoice.tvaAmount || 0;

          if (field === 'montantHT' || field === 'tvaPercentage') {
            const newMontantHT = field === 'montantHT' ? value : currentMontantHT;
            const newTvaPercentage = field === 'tvaPercentage' ? value : currentTvaPercentage;

            const calculatedTvaAmount = newMontantHT * (newTvaPercentage / 100);
            const calculatedTotalTTC = newMontantHT + calculatedTvaAmount;

            updatedInvoice = {
              ...updatedInvoice,
              tvaAmount: calculatedTvaAmount,
              totalTTC: calculatedTotalTTC
            };
          } else if (field === 'tvaAmount') {
            const newTvaAmount = value;
            const calculatedTotalTTC = currentMontantHT + newTvaAmount;
            const calculatedTvaPercentage = currentMontantHT !== 0 ? (newTvaAmount / currentMontantHT) * 100 : 0;

            updatedInvoice = {
              ...updatedInvoice,
              totalTTC: calculatedTotalTTC,
              tvaPercentage: calculatedTvaPercentage
            };
          }
        } else if (field === 'contract') {
          const selectedContract = contracts.find(c => c._id === value);
          updatedInvoice = { ...updatedInvoice, contract: selectedContract };

          if (selectedContract && selectedContract.total !== undefined) {
            const contractTotalTTC = selectedContract.total;
            const currentTvaPercentage = updatedInvoice.tvaPercentage || 0;

            let calculatedMontantHT = 0;
            let calculatedTvaAmount = 0;

            if (currentTvaPercentage !== 0) {
              calculatedMontantHT = contractTotalTTC / (1 + currentTvaPercentage / 100);
              calculatedTvaAmount = contractTotalTTC - calculatedMontantHT;
            } else {
              calculatedMontantHT = contractTotalTTC;
              calculatedTvaAmount = 0;
            }

            updatedInvoice = {
              ...updatedInvoice,
              totalTTC: contractTotalTTC,
              montantHT: calculatedMontantHT,
              tvaAmount: calculatedTvaAmount,
            };
          } else {
            updatedInvoice = {
              ...updatedInvoice,
              totalTTC: 0,
              montantHT: 0,
              tvaAmount: 0,
              tvaPercentage: 0,
            };
          }
        } else if (field === 'client') {
          const selectedClient = customers.find(c => c._id === value);
          updatedInvoice = { ...updatedInvoice, client: selectedClient };
        }

        return updatedInvoice;
      });
    }
  };

  const handleDateChange = (date: Date | null, fieldName: 'invoiceDate' | 'dueDate') => {
    if (editedInvoice) {
      setEditedInvoice(prev => ({ ...prev!, [fieldName]: date ? date.toISOString().split('T')[0] : '' }));
    }
  };

  // Format currency in French locale with DH
  const formatCurrency = (value?: number) => {
    return (value ?? 0).toLocaleString('fr-FR') + ' DH';
  };

  // Build printable HTML for an invoice using the provided template and current data
  const buildInvoiceHtml = (invoice: Facture) => {
    // Resolve contract object: invoice.contract may be an id or a populated object
    const contractObj: Contract | undefined = invoice.contract && typeof invoice.contract === 'object'
      ? (invoice.contract as Contract)
      : contracts.find(c => c._id === (invoice.contract as any));

    const vehicle = contractObj?.vehicle as any;
    const carRented = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''}`.trim() : 'N/A';
    const daysRented = contractObj?.duration ?? (typeof invoice.contract === 'object' ? (invoice.contract as any).duration : undefined) ?? 'N/A';

  const clientName = invoice.client ? `${invoice.client.prenomFr || ''} ${invoice.client.nomFr || ''}`.trim() : 'N/A';
  const ice = invoice.client?.ice || '';
  const dateFacture = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('fr-FR') : '';

  // Resolve image URLs to new /media path (use origin so print window can load them)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const netcarSrc = `${origin}/media/netcar.png`;
  const netSrc = `${origin}/media/net.png`;
  // Convert number to French words (handles dirhams and centimes)
  const numberToFrenchWords = (n: number): string => {
    if (n === 0) return 'zéro';
  const units = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
  const tens: string[] = ['','dix','vingt','trente','quarante','cinquante','soixante','soixante-dix','quatre-vingt','quatre-vingt-dix'];

    const underHundred = (num: number): string => {
      if (num < 17) return units[num];
      if (num < 20) return 'dix-' + units[num - 10];
      if (num < 70) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        return u === 0 ? tens[t] : (tens[t] + (u === 1 && (t === 1 || t === 7 || t === 9) ? '-et-un' : '-' + units[u]).replace('-un','-un'));
      }
      if (num < 80) { // 70..79 -> soixante + 10..19
        return 'soixante-' + underHundred(num - 60);
      }
      if (num < 100) { // 80..99
        if (num === 80) return 'quatre-vingts';
        return 'quatre-vingt-' + underHundred(num - 80);
      }
      return '';
    };

    const underThousand = (num: number): string => {
      const h = Math.floor(num / 100);
      const rest = num % 100;
      let res = '';
      if (h > 0) {
        if (h === 1) res = 'cent';
        else res = units[h] + ' cent';
        if (rest === 0 && h > 1) res += 's';
      }
      if (rest > 0) {
        if (res) res += ' ';
        res += underHundred(rest);
      }
      return res;
    };

    const parts = [] as string[];
    const milliards = Math.floor(n / 1_000_000_000);
    if (milliards) { parts.push((milliards === 1 ? 'milliard' : numberToFrenchWords(milliards) + ' milliards')); n -= milliards * 1_000_000_000; }
    const millions = Math.floor(n / 1_000_000);
    if (millions) { parts.push((millions === 1 ? 'un million' : numberToFrenchWords(millions) + ' millions')); n -= millions * 1_000_000; }
    const milliers = Math.floor(n / 1000);
    if (milliers) { parts.push((milliers === 1 ? 'mille' : numberToFrenchWords(milliers) + ' mille')); n -= milliers * 1000; }
    if (n > 0) parts.push(underThousand(n));
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  const totalAmount = Math.round(((invoice.totalTTC ?? 0) + Number.EPSILON) * 100) / 100;
  const dirhams = Math.floor(totalAmount);
  const centimes = Math.round((totalAmount - dirhams) * 100);
  const amountInWords = `${numberToFrenchWords(dirhams)} dirhams${centimes > 0 ? ' et ' + numberToFrenchWords(centimes) + ' centimes' : ''}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoiceNumber || ''}</title>
  <style>
    :root{ --bg:#f6f7fb; --card:#ffffff; --muted:#6b7280; --accent:#0f62fe; --border:#e6e9ef; --table-head:#f3f5f9; --success:#e6fff4; }
    body{ margin:0; padding:28px; background:var(--bg); font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111827; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
    .invoice-container{ max-width:920px; margin:0 auto; background:var(--card); padding:36px; border-radius:12px; box-shadow:0 8px 30px rgba(15,23,42,0.08); border:1px solid var(--border); }
    .header{ display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:28px; padding-bottom:8px; border-bottom:1px solid var(--border); }
    .logo-left, .logo-right{ height:110px; object-fit:contain; display:block; }
    .logo-left{ max-width:420px; } .logo-right{ max-width:420px; }
    .invoice-info{ display:grid; grid-template-columns: 1fr 240px; gap:18px; align-items:start; margin-top:18px; margin-bottom:18px; }
    .left-info{ padding:14px 18px; border-radius:8px; background:#fbfdff; border:1px dashed var(--border); }
    .left-info p{ margin:6px 0; color:var(--muted); } .left-info p strong{ color:#111827; font-weight:600; }
    .right-info{ text-align:right; color:var(--muted); } .right-info p{ margin:6px 0; }
    table{ width:100%; border-collapse:separate; border-spacing:0; margin-top:8px; overflow:hidden; border-radius:8px; }
    thead th{ background:var(--table-head); color:#111827; font-weight:700; text-transform:uppercase; font-size:13px; padding:14px 18px; border-bottom:1px solid var(--border); text-align:left; letter-spacing:0.6px; }
    tbody td{ background:#fff; padding:14px 18px; border-bottom:1px solid var(--border); vertical-align:middle; }
    tbody td:nth-child(2){ text-align:right; color:#0b1226; font-variant-numeric:proportional-nums; }
    tbody tr:nth-child(even) td{ background:#fbfbfc; }
    tbody > tr:first-child td{ padding:28px 20px; font-size:1.04rem; min-height:110px; background:linear-gradient(180deg,#fff,#fbfdff); }
    tbody > tr:last-child td{ font-weight:800; background:var(--success); font-size:1.02rem; }
  .amount-row{ display:flex; gap:12px; align-items:center; margin-top:18px; }
  /* Make amount in words larger and allow wrapping/multi-line */
  .Amount.in.words{ flex:1; padding:14px 16px; border-bottom:2px dashed var(--border); min-height:80px; color:#111827; font-style:italic; font-size:1.05rem; line-height:1.35; white-space:normal; word-break:break-word; }
    @media print{ body{ background:#fff; padding:0; } .invoice-container{ box-shadow:none; border:none; } .header, .invoice-info{ border-color:#ddd; } }
    @media (max-width:720px){ .invoice-container{ padding:20px; } .invoice-info{ grid-template-columns: 1fr; } .right-info{ text-align:left; } .logo-left, .logo-right{ height:90px; max-width:320px; } tbody > tr:first-child td{ min-height:80px; padding:18px; } }
    .invoice-footer{ margin-top:26px; padding-top:12px; border-top:1px solid var(--border); text-align:center; color:var(--muted); font-size:13px; line-height:1.4; }
    .signatures{ display:flex; gap:24px; margin-top:22px; align-items:flex-end; justify-content:space-between; }
    .sign-box{ flex:1; min-height:120px; border:1px dashed var(--border); border-radius:8px; background:#fff; padding:14px; display:flex; flex-direction:column; justify-content:flex-end; }
    .sign-box.small{ max-width:55%; min-height:160px; } .sign-label{ font-size:13px; color:var(--muted); margin-bottom:6px; } .sign-line{ height:2px; background:transparent; border-bottom:1px solid #111827; width:70%; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
    <img src="${netcarSrc}" alt="Logo Left" class="logo-left">
    <img src="${netSrc}" alt="Logo Right" class="logo-right">
  </div>

  <div class="invoice-info">
    <div class="left-info">
      <p><strong>Facture:</strong> ${invoice.invoiceNumber || ''}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>ICE:</strong> ${ice}</p>
    </div>
    <div class="right-info">
      <p><strong>Date:</strong> ${dateFacture}</p>
      <p><strong>Lieu:</strong> ${invoice.location || ''}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>DÉSIGNATION</th>
        <th>MONTANT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="the car rented">${carRented}</td>
        <td class="day rented">${daysRented}</td>
      </tr>
      <tr>
        <td>HT</td>
        <td class="HT price">${formatCurrency(invoice.montantHT)}</td>
      </tr>
      <tr>
        <td>TVA</td>
        <td class="TVA price">${formatCurrency(invoice.tvaAmount)}</td>
      </tr>
      <tr>
        <td>TTC</td>
        <td class="TTC price">${formatCurrency(invoice.totalTTC)}</td>
      </tr>
    </tbody>
  </table>

  <div class="amount-row" style="margin-top:18px;">
    <div style="font-weight:600;">Arreté la facture à la somme de :</div>
    <div class="Amount in words" style="flex:1; margin-left:12px; min-height:34px; border-bottom:1px solid #000;">${amountInWords}</div>
</div>

  <div class="signatures">
    <div class="sign-box small">
      <div class="sign-label">Cachet</div>
      <div class="sign-line"></div>
    </div>
    <div class="sign-box">
      <div class="sign-label">Signature</div>
      <div class="sign-line"></div>
    </div>
  </div>

  <div class="invoice-footer">N° 24, 1* Étage Angle Rue Oussama Ibnou Zaid (ex. Jura) &amp; Rue Ahmed Joumari (ex rue d'auvergne) - Casablanca<br>
  Tél: 05 20 72 67 32 - GSM: 0661 09 57 41 - 06 63 72 10 40<br>
  E-mail: <a href="mailto:Mednetcar23@gmail.com">contact@mednetcar.ma</a></div>

</div>

</body>
</html>`;
  };

  const handlePrint = (invoice: Facture | null) => {
    if (!invoice) return;
    const html = buildInvoiceHtml(invoice);
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Give browser a moment to render
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // optionally close window after printing
      printWindow.close();
    }, 500);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Factures</h1>
        <button
          onClick={() => {
            setSelectedInvoice(null);
            setShowNewInvoiceModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Facture
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  id="search-invoice"
                  type="text"
                  placeholder="Rechercher une facture..."
                  className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="status-filter" className="sr-only">Filtrer par statut</label>
                  <select
                    id="status-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="paid">Payée</option>
                    <option value="unpaid">Non payée</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="start-date-filter" className="sr-only">Date de début</label>
                  <DatePicker
                    id="start-date-filter"
                    selected={startDateFilter}
                    onChange={(date: Date | null) => setStartDateFilter(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    placeholderText="Date de début"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="end-date-filter" className="sr-only">Date de fin</label>
                  <DatePicker
                    id="end-date-filter"
                    selected={endDateFilter}
                    onChange={(date: Date | null) => setEndDateFilter(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    placeholderText="Date de fin"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  return (
                    <tr
                      key={invoice._id}
                      onClick={() => {
                        setSelectedInvoice(invoice);
                      }}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedInvoice?._id === invoice._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {`${invoice.client?.prenomFr || ''} ${invoice.client?.nomFr || ''}`.trim() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.totalTTC.toLocaleString('fr-FR')} DH
                        </div>
                        <div className={`text-xs ${getStatusColor(invoice)}`}>
                          {invoice.amountPaid >= invoice.totalTTC
                            ? 'Payée'
                            : `Reste: ${(invoice.totalTTC - invoice.amountPaid).toLocaleString('fr-FR')} DH`
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <EditButton
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                            handleEditClick();
                          }}
                          size="md"
                          className="mr-3"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(invoice._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Aucune facture trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedInvoice ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la facture</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateInvoice}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {editMode && editedInvoice ? (
                  <div className="space-y-4">
                    {/* Facture Details Section - Edit Mode */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">N° Facture (*)</label>
                        <input
                          type="text"
                          name="invoiceNumber"
                          id="invoiceNumber"
                          value={editedInvoice.invoiceNumber || ''}
                          onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">Date Facture (*)</label>
                        <DatePicker
                          selected={editedInvoice.invoiceDate ? new Date(editedInvoice.invoiceDate) : null}
                          onChange={(date) => handleDateChange(date, 'invoiceDate')}
                          locale="fr"
                          dateFormat="dd/MM/yyyy"
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance (*)</label>
                        <DatePicker
                          selected={editedInvoice.dueDate ? new Date(editedInvoice.dueDate) : null}
                          onChange={(date) => handleDateChange(date, 'dueDate')}
                          locale="fr"
                          dateFormat="dd/MM/yyyy"
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Client (*)</label>
                        <select
                          name="client"
                          id="client"
                          value={editedInvoice.client?._id || ''}
                          onChange={(e) => handleInputChange('client', e.target.value)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        >
                          <option value="">Sélectionner un client</option>
                          {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.prenomFr} {customer.nomFr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">Contrat (*)</label>
                        <select
                          name="contract"
                          id="contract"
                          value={editedInvoice.contract?._id || ''}
                          onChange={(e) => handleInputChange('contract', e.target.value)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        >
                          <option value="">Sélectionner un contrat</option>
                          {contracts.map(contract => (
                            <option key={contract._id} value={contract._id}>
                              {contract.contractNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lieu (*)</label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          value={editedInvoice.location || ''}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.location ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                          required
                        />
                        {validationErrors.location && <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>}
                      </div>
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type (*)</label>
                        <select
                          name="type"
                          id="type"
                          value={editedInvoice.type || 'Particulier'}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        >
                          <option value="Professionel">Professionel</option>
                          <option value="Particulier">Particulier</option>
                        </select>
                      </div>
                    </div>

                    {/* Montants Section - Edit Mode */}
                    <div className="mt-6 border-t pt-4 space-y-4">
                      <h3 className="font-medium mb-2">Montants</h3>
                      <div>
                        <label htmlFor="montantHT" className="block text-sm font-medium text-gray-700 mb-1">Montant HT (*)</label>
                        <input
                          type="number"
                          name="montantHT"
                          id="montantHT"
                          value={editedInvoice.montantHT || 0}
                          onChange={(e) => handleInputChange('montantHT', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tvaPercentage" className="block text-sm font-medium text-gray-700 mb-1">Pourcentage TVA (%) (*)</label>
                        <input
                          type="number"
                          name="tvaPercentage"
                          id="tvaPercentage"
                          value={editedInvoice.tvaPercentage || 0}
                          onChange={(e) => handleInputChange('tvaPercentage', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="tvaAmount" className="block text-sm font-medium text-gray-700 mb-1">Montant TVA (*)</label>
                        <input
                          type="number"
                          name="tvaAmount"
                          id="tvaAmount"
                          value={editedInvoice.tvaAmount || 0}
                          onChange={(e) => handleInputChange('tvaAmount', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="totalTTC" className="block text-sm font-medium text-gray-700 mb-1">Montant TTC (*)</label>
                        <input
                          type="number"
                          name="totalTTC"
                          id="totalTTC"
                          value={editedInvoice.totalTTC || 0}
                          onChange={(e) => handleInputChange('totalTTC', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Paiement Section - Edit Mode */}
                    <div className="mt-6 border-t pt-4 space-y-4">
                      <h3 className="font-medium mb-2">Paiement</h3>
                      <div>
                        <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Type de Paiement (*)</label>
                        <select
                          name="paymentType"
                          id="paymentType"
                          value={editedInvoice.paymentType || 'espèce'}
                          onChange={(e) => handleInputChange('paymentType', e.target.value)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        >
                          <option value="espèce">Espèce</option>
                          <option value="chèque">Chèque</option>
                          <option value="carte bancaire">Carte Bancaire</option>
                          <option value="virement">Virement</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Montant Payé (*)</label>
                        <input
                          type="number"
                          name="amountPaid"
                          id="amountPaid"
                          value={editedInvoice.amountPaid || 0}
                          onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg p-2 mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">N° Facture</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date Facture</p>
                      <p className="font-medium">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date d'échéance</p>
                      <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium">{selectedInvoice.client ? `${selectedInvoice.client.prenomFr} ${selectedInvoice.client.nomFr}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contrat</p>
                      <p className="font-medium">{selectedInvoice.contract?.contractNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lieu</p>
                      <p className="font-medium">{selectedInvoice.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedInvoice.type}</p>
                    </div>

                    {/* Montants Section - View Mode */}
                    <div className="mt-6 border-t pt-4 space-y-2">
                      <h3 className="font-medium mb-2">Montants</h3>
                      <div>
                        <p className="text-sm text-gray-500">Montant HT</p>
                        <p className="font-medium">{selectedInvoice.montantHT.toLocaleString('fr-FR')} DH</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pourcentage TVA</p>
                        <p className="font-medium">{selectedInvoice.tvaPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Montant TVA</p>
                        <p className="font-medium">{selectedInvoice.tvaAmount.toLocaleString('fr-FR')} DH</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Montant TTC</p>
                        <p className="font-bold">{selectedInvoice.totalTTC.toLocaleString('fr-FR')} DH</p>
                      </div>
                    </div>

                    {/* Paiement Section - View Mode */}
                    <div className="mt-6 border-t pt-4 space-y-2">
                      <h3 className="font-medium mb-2">Paiement</h3>
                      <div>
                        <p className="text-sm text-gray-500">Type de Paiement</p>
                        <p className="font-medium">{selectedInvoice.paymentType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Montant Payé</p>
                        <p className="font-medium">{selectedInvoice.amountPaid.toLocaleString('fr-FR')} DH</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handlePrint(selectedInvoice)}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Imprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Aucune facture sélectionnée</p>
            </div>
          )}
        </div>
      </div>

      {showNewInvoiceModal && (
        <InvoiceForm
          onSubmit={handleAddInvoice}
          onClose={() => setShowNewInvoiceModal(false)}
          initialData={null} // Only for adding new invoices
          API_URL={API_URL} // Pass API_URL to InvoiceForm
        />
      )}
    </div>
  );
};

const InvoiceForm = ({
  onSubmit,
  onClose,
  initialData,
  API_URL // Receive API_URL
}: {
  onSubmit: (data: Partial<Facture>) => void; // Use Facture interface
  onClose: () => void;
  initialData: Facture | null;
  API_URL: string; // Define API_URL prop
}) => {
  const [formData, setFormData] = useState<Partial<Facture>>(initialData || {
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    client: undefined,
    contract: undefined,
    location: '',
    type: 'Particulier',
    montantHT: 0,
    tvaAmount: 0,
    tvaPercentage: 20,
    totalTTC: 0,
    paymentType: 'espèce',
    amountPaid: 0
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const API_URL_CUSTOMERS = `${API_URL}/api/customers`;
  const API_URL_CONTRACTS = `${API_URL}/api/contracts`;
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<keyof Partial<Facture> | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchCustomersAndContracts = async () => {
      try {
        const [customersResponse, contractsResponse] = await Promise.all([
          axios.get<Customer[]>(API_URL_CUSTOMERS),
          axios.get<Contract[]>(API_URL_CONTRACTS)
        ]);
        setCustomers(customersResponse.data);
        setContracts(contractsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load customers or contracts for the form.');
      }
    };
    fetchCustomersAndContracts();
  }, [API_URL_CUSTOMERS, API_URL_CONTRACTS]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        invoiceDate: initialData.invoiceDate.split('T')[0],
        dueDate: initialData.dueDate.split('T')[0],
      });
    } else {
      setFormData({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        client: undefined,
        contract: undefined,
        location: '',
        type: 'Particulier',
        montantHT: 0,
        tvaAmount: 0,
        tvaPercentage: 20,
        totalTTC: 0,
        paymentType: 'espèce',
        amountPaid: 0
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'location') {
      if (isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Le champ "Lieu" ne peut pas contenir uniquement des espaces.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = parseFloat(value) || 0;

    setFormData(prev => {
      let updatedFormData = { ...prev, [name]: newValue };

      const currentMontantHT = updatedFormData.montantHT || 0;
      const currentTvaPercentage = updatedFormData.tvaPercentage || 0;
      const currentTvaAmount = updatedFormData.tvaAmount || 0;

      if (name === 'montantHT' || name === 'tvaPercentage') {
        const newMontantHT = name === 'montantHT' ? newValue : currentMontantHT;
        const newTvaPercentage = name === 'tvaPercentage' ? newValue : currentTvaPercentage;

        const calculatedTvaAmount = newMontantHT * (newTvaPercentage / 100);
        const calculatedTotalTTC = newMontantHT + calculatedTvaAmount;

        updatedFormData = {
          ...updatedFormData,
          tvaAmount: calculatedTvaAmount,
          totalTTC: calculatedTotalTTC
        };
      } else if (name === 'tvaAmount') {
        const newTvaAmount = newValue;
        const calculatedTotalTTC = currentMontantHT + newTvaAmount;
        const calculatedTvaPercentage = currentMontantHT !== 0 ? (newTvaAmount / currentMontantHT) * 100 : 0;

        updatedFormData = {
          ...updatedFormData,
          totalTTC: calculatedTotalTTC,
          tvaPercentage: calculatedTvaPercentage
        };
      }
      return updatedFormData;
    });
  };

  const handleDateChange = (date: Date | null, fieldName: 'invoiceDate' | 'dueDate') => {
    setFormData(prev => ({ ...prev, [fieldName]: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedClient = customers.find(c => c._id === clientId);
    setFormData(prev => ({ ...prev, client: selectedClient }));
  };

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractId = e.target.value;
    const selectedContract = contracts.find(c => c._id === contractId);

    setFormData(prev => {
      let updatedFormData: Partial<Facture> = {
        ...prev,
        contract: selectedContract,
      };

      if (selectedContract && selectedContract.total !== undefined) {
        const contractTotalTTC = selectedContract.total;
        const currentTvaPercentage = updatedFormData.tvaPercentage || 0;

        let calculatedMontantHT = 0;
        let calculatedTvaAmount = 0;

        if (currentTvaPercentage !== 0) {
          calculatedMontantHT = contractTotalTTC / (1 + currentTvaPercentage / 100);
          calculatedTvaAmount = contractTotalTTC - calculatedMontantHT;
        } else {
          calculatedMontantHT = contractTotalTTC;
          calculatedTvaAmount = 0;
        }

        updatedFormData = {
          ...updatedFormData,
          totalTTC: contractTotalTTC,
          montantHT: calculatedMontantHT,
          tvaAmount: calculatedTvaAmount,
        };
      } else {
        // If no contract selected or total is undefined, reset related fields
        updatedFormData = {
          ...updatedFormData,
          totalTTC: 0,
          montantHT: 0,
          tvaAmount: 0,
          tvaPercentage: 0, // Reset TVA percentage as well
        };
      }
      return updatedFormData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = initialData
      ? ['invoiceNumber', 'invoiceDate', 'dueDate', 'client', 'contract', 'location', 'type', 'montantHT', 'tvaAmount', 'tvaPercentage', 'totalTTC', 'paymentType', 'amountPaid']
      : ['invoiceDate', 'dueDate', 'client', 'contract', 'location', 'type', 'montantHT', 'tvaAmount', 'tvaPercentage', 'totalTTC', 'paymentType', 'amountPaid'];
    const errors: {[key: string]: string} = {};
    requiredFields.forEach(field => {
      if (!formData[field as keyof Partial<Facture>]) {
        errors[field] = 'Ce champ est obligatoire.';
      }
    });

    if (isOnlySpaces(formData.location)) {
      errors.location = 'Le champ "Lieu" ne peut pas être vide ou contenir uniquement des espaces.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    onSubmit(formData);
  };

  const openKeyboard = (inputName: keyof Partial<Facture>) => { // Use Facture interface
    setActiveInput(inputName);
    setKeyboardOpen(true);
  };

  const handleKeyboardInput = (value: string) => {
    if (activeInput) {
      setFormData(prev => ({ ...prev, [activeInput]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <CloseButton onClick={onClose} />
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Modifier la Facture' : 'Nouvelle Facture'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Facture Details */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Détails de la Facture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialData && (
                <div className="flex flex-col">
                  <label htmlFor="invoiceNumber" className="text-sm font-medium text-gray-700 mb-1">N° Facture (*)</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    id="invoiceNumber"
                    value={formData.invoiceNumber || ''}
                    onChange={handleChange}
                    className="border rounded-lg p-2"
                    required
                  />
                </div>
              )}
              <div className="flex flex-col">
                <label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700 mb-1">Date Facture (*)</label>
                <DatePicker
                  selected={formData.invoiceDate ? new Date(formData.invoiceDate) : null}
                  onChange={(date) => handleDateChange(date, 'invoiceDate')}
                  locale="fr"
                  dateFormat="dd/MM/yyyy"
                  className="border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 mb-1">Date d'échéance (*)</label>
                <DatePicker
                  selected={formData.dueDate ? new Date(formData.dueDate) : null}
                  onChange={(date) => handleDateChange(date, 'dueDate')}
                  locale="fr"
                  dateFormat="dd/MM/yyyy"
                  className="border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="client" className="text-sm font-medium text-gray-700 mb-1">Client (*)</label>
                <select
                  name="client"
                  id="client"
                  value={formData.client?._id || ''}
                  onChange={handleClientChange}
                  className="border rounded-lg p-2"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.prenomFr} {customer.nomFr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="contract" className="text-sm font-medium text-gray-700 mb-1">Contrat (*)</label>
                <select
                  name="contract"
                  id="contract"
                  value={formData.contract?._id || ''}
                  onChange={handleContractChange}
                  className="border rounded-lg p-2"
                  required
                >
                  <option value="">Sélectionner un contrat</option>
                  {contracts.map(contract => (
                    <option key={contract._id} value={contract._id}>
                      {contract.contractNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1">Lieu (*)</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className={`border rounded-lg p-2 ${validationErrors.location ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                />
                {validationErrors.location && <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>}
              </div>
              <div className="flex flex-col">
                <label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1">Type (*)</label>
                <select
                  name="type"
                  id="type"
                  value={formData.type || 'Particulier'}
                  onChange={handleChange}
                  className="border rounded-lg p-2"
                  required
                >
                  <option value="Professionel">Professionel</option>
                  <option value="Particulier">Particulier</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section Montants */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Montants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label htmlFor="montantHT" className="text-sm font-medium text-gray-700 mb-1">Montant HT (*)</label>
                <input
                  type="number"
                  name="montantHT"
                  id="montantHT"
                  value={formData.montantHT || 0}
                  onChange={handleNumberChange}
                  className="border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="tvaPercentage" className="text-sm font-medium text-gray-700 mb-1">Pourcentage TVA (%) (*)</label>
                <input
                  type="number"
                  name="tvaPercentage"
                  id="tvaPercentage"
                  value={formData.tvaPercentage || 0}
                  onChange={handleNumberChange}
                  className="border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="tvaAmount" className="text-sm font-medium text-gray-700 mb-1">Montant TVA (*)</label>
                <input
                  type="number"
                  name="tvaAmount"
                  id="tvaAmount"
                  value={formData.tvaAmount || 0}
                  onChange={handleNumberChange}
                  className="border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="totalTTC" className="text-sm font-medium text-gray-700 mb-1">Montant TTC (*)</label>
                <input
                  type="number"
                  name="totalTTC"
                  id="totalTTC"
                  value={formData.totalTTC || 0}
                  onChange={handleNumberChange}
                  className="border rounded-lg p-2 bg-gray-100"
                  required
                  readOnly
                />
              </div>
            </div>
          </section>

          {/* Section Paiement */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label htmlFor="paymentType" className="text-sm font-medium text-gray-700 mb-1">Type de Paiement (*)</label>
                <select
                  name="paymentType"
                  id="paymentType"
                  value={formData.paymentType || 'espèce'}
                  onChange={handleChange}
                  className="border rounded-lg p-2"
                  required
                >
                  <option value="espèce">Espèce</option>
                  <option value="chèque">Chèque</option>
                  <option value="carte bancaire">Carte Bancaire</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="amountPaid" className="text-sm font-medium text-gray-700 mb-1">Montant Payé (*)</label>
                <input
                  type="number"
                  name="amountPaid"
                  id="amountPaid"
                  value={formData.amountPaid || 0}
                  onChange={handleNumberChange}
                  className="border rounded-lg p-2"
                  required
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Modifier' : 'Ajouter'} Facture
            </button>
          </div>
        </form>
      </div>
      <ArabicKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onInput={handleKeyboardInput}
        initialValue={activeInput ? String(formData[activeInput]) : ''}
      />
    </div>
  );
};

export default Factures;
